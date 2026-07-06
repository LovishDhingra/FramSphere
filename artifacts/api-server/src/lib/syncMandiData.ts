import { eq, and, sql } from "drizzle-orm";
import { db, marketsTable, mandiPricesTable } from "@workspace/db";
import { fetchLiveMandiRecords, parseArrivalDate, type RawMandiRecord } from "./dataGovIn";
import { geocodeIndianLocation } from "./openMeteo";
import { logger } from "./logger";

/**
 * Syncs live mandi price + market data from data.gov.in into Postgres.
 * The government API only exposes a current-day snapshot (no historical
 * range query), so each sync appends today's real prices — trend history
 * accumulates naturally as this runs over time instead of being backfilled
 * with synthetic data.
 */
export async function syncMandiData(): Promise<{ marketsUpserted: number; pricesUpserted: number }> {
  logger.info("starting live mandi data sync from data.gov.in");

  const records = await fetchLiveMandiRecords();
  logger.info({ count: records.length }, "fetched live mandi records");

  const marketKey = (r: RawMandiRecord) => `${r.market}||${r.state}||${r.district}`;
  const uniqueMarkets = new Map<string, RawMandiRecord>();
  for (const r of records) {
    uniqueMarkets.set(marketKey(r), r);
  }

  let marketsUpserted = 0;
  for (const r of uniqueMarkets.values()) {
    const existing = await db
      .select({ id: marketsTable.id, latitude: marketsTable.latitude })
      .from(marketsTable)
      .where(
        and(
          eq(marketsTable.name, r.market),
          eq(marketsTable.state, r.state),
          eq(marketsTable.district, r.district),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    const geo = await geocodeIndianLocation(
      `${r.market}, ${r.district}, ${r.state}`,
      `${r.district}, ${r.state}`,
    );

    await db
      .insert(marketsTable)
      .values({
        name: r.market,
        state: r.state,
        district: r.district,
        latitude: geo ? String(geo.latitude) : null,
        longitude: geo ? String(geo.longitude) : null,
        type: "APMC",
      })
      .onConflictDoNothing({ target: [marketsTable.name, marketsTable.state, marketsTable.district] });

    marketsUpserted++;
  }

  let pricesUpserted = 0;
  for (const r of records) {
    const priceDate = parseArrivalDate(r.arrival_date);
    const minPrice = Number(r.min_price);
    const maxPrice = Number(r.max_price);
    const modalPrice = Number(r.modal_price);
    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || !Number.isFinite(modalPrice)) {
      continue;
    }

    await db
      .insert(mandiPricesTable)
      .values({
        crop: r.commodity,
        variety: r.variety || "General",
        market: r.market,
        state: r.state,
        district: r.district,
        minPrice: String(minPrice),
        maxPrice: String(maxPrice),
        modalPrice: String(modalPrice),
        arrivals: null,
        priceDate,
        source: "data.gov.in",
      })
      .onConflictDoUpdate({
        target: [
          mandiPricesTable.market,
          mandiPricesTable.crop,
          mandiPricesTable.variety,
          mandiPricesTable.priceDate,
        ],
        set: {
          minPrice: String(minPrice),
          maxPrice: String(maxPrice),
          modalPrice: String(modalPrice),
        },
      });

    pricesUpserted++;
  }

  logger.info({ marketsUpserted, pricesUpserted }, "completed live mandi data sync");
  return { marketsUpserted, pricesUpserted };
}

/** Total count of price rows currently stored — used to decide if an initial sync is needed. */
export async function getMandiPriceCount(): Promise<number> {
  const [row] = await db.select({ count: sql<string>`COUNT(*)` }).from(mandiPricesTable);
  return Number(row?.count ?? 0);
}
