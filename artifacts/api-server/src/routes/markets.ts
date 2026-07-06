import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, marketsTable, mandiPricesTable, mspTable } from "@workspace/db";
import {
  ListMarketsQueryParams,
  ListMarketsResponse,
  RecommendMarketsQueryParams,
  RecommendMarketsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Haversine formula — returns distance in km between two GPS points
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

router.get("/markets/states", async (req, res): Promise<void> => {
  const rows = await db
    .selectDistinct({ state: marketsTable.state })
    .from(marketsTable)
    .orderBy(marketsTable.state);

  res.json({ states: rows.map((r) => r.state) });
});

router.get("/markets/nearby", async (req, res): Promise<void> => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius) || 200;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng query params are required" });
    return;
  }

  const rows = await db.select().from(marketsTable);

  const nearby = rows
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      state: r.state,
      district: r.district,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      type: r.type,
      distanceKm: haversineKm(lat, lng, Number(r.latitude), Number(r.longitude)),
    }))
    .filter((r) => r.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 15);

  res.json(nearby);
});

router.get("/markets", async (req, res): Promise<void> => {
  const parsed = ListMarketsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { state, district } = parsed.data;

  const conditions = [];
  if (state) conditions.push(eq(marketsTable.state, state));
  if (district) conditions.push(eq(marketsTable.district, district));

  const rows = await db
    .select()
    .from(marketsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(marketsTable.state, marketsTable.name);

  const result = rows.map((r) => ({
    ...r,
    latitude: r.latitude != null ? Number(r.latitude) : null,
    longitude: r.longitude != null ? Number(r.longitude) : null,
  }));

  res.json(ListMarketsResponse.parse(result));
});

router.get("/markets/recommend", async (req, res): Promise<void> => {
  const parsed = RecommendMarketsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { crop, location } = parsed.data;

  const priceRows = await db
    .select({
      market: mandiPricesTable.market,
      state: mandiPricesTable.state,
      district: mandiPricesTable.district,
      modalPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
    })
    .from(mandiPricesTable)
    .where(eq(mandiPricesTable.crop, crop))
    .groupBy(mandiPricesTable.market, mandiPricesTable.state, mandiPricesTable.district)
    .orderBy(sql`AVG(${mandiPricesTable.modalPrice}::numeric) DESC`)
    .limit(10);

  const mspRows = await db
    .select()
    .from(mspTable)
    .where(eq(mspTable.crop, crop))
    .limit(1);

  const mspPrice = mspRows.length > 0 ? Number(mspRows[0].mspPrice) : null;

  const result = priceRows.map((r, idx) => {
    const modalPrice = Math.round(Number(r.modalPrice) * 100) / 100;
    const premiumOverMsp = mspPrice
      ? Math.round(((modalPrice - mspPrice) / mspPrice) * 10000) / 100
      : null;
    const score = Math.max(0, 100 - idx * 10);

    return {
      market: r.market,
      state: r.state,
      district: r.district,
      modalPrice,
      mspPrice,
      premiumOverMsp,
      distanceKm: null,
      score,
      reason:
        idx === 0
          ? `Best price for ${crop} — ${premiumOverMsp !== null ? `${premiumOverMsp > 0 ? "+" : ""}${premiumOverMsp}% vs MSP` : "highest modal price"}`
          : `Good price with active trading volume for ${crop}`,
    };
  });

  res.json(RecommendMarketsResponse.parse(result));
});

export default router;
