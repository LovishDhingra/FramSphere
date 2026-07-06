import { Router, type IRouter } from "express";
import { and, eq, gte, desc, sql } from "drizzle-orm";
import { db, mandiPricesTable } from "@workspace/db";
import {
  ListPricesQueryParams,
  ListPricesResponse,
  GetPriceTrendsQueryParams,
  GetPriceTrendsResponse,
  ComparePricesQueryParams,
  ComparePricesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/prices", async (req, res): Promise<void> => {
  const parsed = ListPricesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { crop, market, state, limit } = parsed.data;

  const conditions = [];
  if (crop) conditions.push(eq(mandiPricesTable.crop, crop));
  if (market) conditions.push(eq(mandiPricesTable.market, market));
  if (state) conditions.push(eq(mandiPricesTable.state, state));

  const rows = await db
    .select()
    .from(mandiPricesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(mandiPricesTable.priceDate))
    .limit(limit ?? 50);

  const result = rows.map((r) => ({
    ...r,
    minPrice: Number(r.minPrice),
    maxPrice: Number(r.maxPrice),
    modalPrice: Number(r.modalPrice),
    arrivals: r.arrivals != null ? Number(r.arrivals) : null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }));

  res.json(ListPricesResponse.parse(result));
});

router.get("/prices/trends", async (req, res): Promise<void> => {
  const parsed = GetPriceTrendsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { crop, market, days } = parsed.data;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (days ?? 30));
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  const conditions = [
    eq(mandiPricesTable.crop, crop),
    gte(mandiPricesTable.priceDate, cutoffStr),
  ];
  if (market) conditions.push(eq(mandiPricesTable.market, market));

  const rows = await db
    .select({
      date: mandiPricesTable.priceDate,
      modalPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
      minPrice: sql<string>`AVG(${mandiPricesTable.minPrice}::numeric)`,
      maxPrice: sql<string>`AVG(${mandiPricesTable.maxPrice}::numeric)`,
      arrivals: sql<string>`SUM(${mandiPricesTable.arrivals}::numeric)`,
    })
    .from(mandiPricesTable)
    .where(and(...conditions))
    .groupBy(mandiPricesTable.priceDate)
    .orderBy(mandiPricesTable.priceDate);

  const result = rows.map((r) => ({
    date: r.date,
    modalPrice: Number(r.modalPrice),
    minPrice: Number(r.minPrice),
    maxPrice: Number(r.maxPrice),
    arrivals: r.arrivals != null ? Number(r.arrivals) : null,
  }));

  res.json(GetPriceTrendsResponse.parse(result));
});

router.get("/prices/compare", async (req, res): Promise<void> => {
  const parsed = ComparePricesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { crop, state } = parsed.data;

  const conditions = [eq(mandiPricesTable.crop, crop)];
  if (state) conditions.push(eq(mandiPricesTable.state, state));

  const rows = await db
    .select({
      market: mandiPricesTable.market,
      state: mandiPricesTable.state,
      modalPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
    })
    .from(mandiPricesTable)
    .where(and(...conditions))
    .groupBy(mandiPricesTable.market, mandiPricesTable.state)
    .orderBy(sql`AVG(${mandiPricesTable.modalPrice}::numeric) DESC`);

  const prices = rows.map((r) => Number(r.modalPrice));
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  const result = rows.map((r, idx) => ({
    market: r.market,
    state: r.state,
    modalPrice: Math.round(Number(r.modalPrice) * 100) / 100,
    deviation: avgPrice > 0 ? Math.round(((Number(r.modalPrice) - avgPrice) / avgPrice) * 10000) / 100 : 0,
    rank: idx + 1,
  }));

  res.json(ComparePricesResponse.parse(result));
});

export default router;
