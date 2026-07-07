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

/**
 * Background geocoding backfill: finds all markets that were inserted without
 * coordinates (because they existed before geocoding was added, or because the
 * live geocoding failed at insert time) and fills them in using the Open-Meteo
 * geocoding API (free, no key needed). Runs non-blocking in the background
 * with a 300 ms delay between requests to respect rate limits.
 */
export async function geocodeMissingMarkets(): Promise<void> {
  const missing = await db
    .select({ id: marketsTable.id, name: marketsTable.name, district: marketsTable.district, state: marketsTable.state })
    .from(marketsTable)
    .where(sql`${marketsTable.latitude} IS NULL`);

  if (missing.length === 0) return;

  logger.info({ count: missing.length }, "geocoding markets that are missing coordinates");

  let geocoded = 0;
  for (const m of missing) {
    try {
      const geo = await geocodeIndianLocation(
        `${m.name}, ${m.district}, ${m.state}`,
        `${m.district}, ${m.state}`,
      );
      if (geo) {
        await db
          .update(marketsTable)
          .set({ latitude: String(geo.latitude), longitude: String(geo.longitude) })
          .where(eq(marketsTable.id, m.id));
        geocoded++;
      }
    } catch (err) {
      logger.warn({ err, market: m.name }, "geocoding failed for market");
    }
    // 300 ms between requests — Open-Meteo geocoding is free but rate-limited
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  logger.info({ geocoded, total: missing.length }, "finished geocoding missing markets");
}
