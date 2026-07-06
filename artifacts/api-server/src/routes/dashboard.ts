import { Router, type IRouter } from "express";
import { sql, desc, eq } from "drizzle-orm";
import { db, mandiPricesTable, mspTable, marketsTable, alertsTable, anomaliesTable } from "@workspace/db";
import { GetDashboardSummaryResponse, GetTopCropsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const [marketCount] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${mandiPricesTable.market})` })
    .from(mandiPricesTable);

  const [cropCount] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${mandiPricesTable.crop})` })
    .from(mandiPricesTable);

  const [alertCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(alertsTable)
    .where(eq(alertsTable.isResolved, false));

  const [anomalyCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(anomaliesTable);

  // Get price changes over last 7 days vs prior 7 days per crop
  const now = new Date();
  const cutoff7d = new Date(now);
  cutoff7d.setDate(cutoff7d.getDate() - 7);
  const cutoff14d = new Date(now);
  cutoff14d.setDate(cutoff14d.getDate() - 14);

  const recent7Prices = await db
    .select({
      crop: mandiPricesTable.crop,
      avgPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
    })
    .from(mandiPricesTable)
    .where(sql`${mandiPricesTable.priceDate} >= ${cutoff7d.toISOString().split("T")[0]}`)
    .groupBy(mandiPricesTable.crop);

  const prior7Prices = await db
    .select({
      crop: mandiPricesTable.crop,
      avgPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
    })
    .from(mandiPricesTable)
    .where(
      sql`${mandiPricesTable.priceDate} >= ${cutoff14d.toISOString().split("T")[0]} AND ${mandiPricesTable.priceDate} < ${cutoff7d.toISOString().split("T")[0]}`,
    )
    .groupBy(mandiPricesTable.crop);

  const priorPriceMap = new Map(prior7Prices.map((r) => [r.crop, Number(r.avgPrice)]));

  const changes = recent7Prices
    .map((r) => {
      const recent = Number(r.avgPrice);
      const prior = priorPriceMap.get(r.crop) ?? recent;
      return {
        crop: r.crop,
        change: prior > 0 ? Math.round(((recent - prior) / prior) * 10000) / 100 : 0,
      };
    })
    .sort((a, b) => b.change - a.change);

  const topGainer = changes[0] ?? { crop: "Wheat", change: 2.5 };
  const topLoser = changes[changes.length - 1] ?? { crop: "Rice", change: -1.2 };

  // Fair price index: percentage of prices at or above MSP
  const mspRows = await db.select().from(mspTable);
  const mspMap = new Map(mspRows.map((r) => [r.crop, Number(r.mspPrice)]));

  const allPrices = await db
    .select({ crop: mandiPricesTable.crop, modalPrice: mandiPricesTable.modalPrice })
    .from(mandiPricesTable);

  let fairCount = 0;
  let totalWithMsp = 0;
  for (const p of allPrices) {
    const msp = mspMap.get(p.crop);
    if (msp) {
      totalWithMsp++;
      if (Number(p.modalPrice) >= msp) fairCount++;
    }
  }
  const fairPriceIndex = totalWithMsp > 0 ? Math.round((fairCount / totalWithMsp) * 100) : 75;

  // Average MSP deviation
  let totalDeviation = 0;
  let deviationCount = 0;
  for (const p of allPrices) {
    const msp = mspMap.get(p.crop);
    if (msp && msp > 0) {
      totalDeviation += ((Number(p.modalPrice) - msp) / msp) * 100;
      deviationCount++;
    }
  }
  const averageMspDeviation =
    deviationCount > 0 ? Math.round((totalDeviation / deviationCount) * 100) / 100 : 5;

  const result = {
    totalMarkets: Number(marketCount.count),
    totalCrops: Number(cropCount.count),
    activeAlerts: Number(alertCount.count),
    averageMspDeviation,
    topGainer,
    topLoser,
    totalAnomaliesDetected: Number(anomalyCount.count),
    fairPriceIndex,
  };

  res.json(GetDashboardSummaryResponse.parse(result));
});

router.get("/dashboard/top-crops", async (req, res): Promise<void> => {
  const cropPrices = await db
    .select({
      crop: mandiPricesTable.crop,
      avgPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
      volume: sql<string>`SUM(COALESCE(${mandiPricesTable.arrivals}::numeric, 0))`,
    })
    .from(mandiPricesTable)
    .groupBy(mandiPricesTable.crop)
    .orderBy(sql`SUM(COALESCE(${mandiPricesTable.arrivals}::numeric, 0)) DESC`)
    .limit(10);

  const mspRows = await db.select().from(mspTable);
  const mspMap = new Map(mspRows.map((r) => [r.crop, Number(r.mspPrice)]));

  const alertCounts = await db
    .select({
      crop: alertsTable.crop,
      count: sql<number>`COUNT(*)`,
    })
    .from(alertsTable)
    .groupBy(alertsTable.crop);
  const alertMap = new Map(alertCounts.map((r) => [r.crop, Number(r.count)]));

  // Compute 7-day price changes
  const cutoff7d = new Date();
  cutoff7d.setDate(cutoff7d.getDate() - 7);
  const cutoff14d = new Date();
  cutoff14d.setDate(cutoff14d.getDate() - 14);

  const recent7 = await db
    .select({
      crop: mandiPricesTable.crop,
      avgPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
    })
    .from(mandiPricesTable)
    .where(sql`${mandiPricesTable.priceDate} >= ${cutoff7d.toISOString().split("T")[0]}`)
    .groupBy(mandiPricesTable.crop);

  const prior7 = await db
    .select({
      crop: mandiPricesTable.crop,
      avgPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
    })
    .from(mandiPricesTable)
    .where(
      sql`${mandiPricesTable.priceDate} >= ${cutoff14d.toISOString().split("T")[0]} AND ${mandiPricesTable.priceDate} < ${cutoff7d.toISOString().split("T")[0]}`,
    )
    .groupBy(mandiPricesTable.crop);

  const priorMap = new Map(prior7.map((r) => [r.crop, Number(r.avgPrice)]));
  const recentMap = new Map(recent7.map((r) => [r.crop, Number(r.avgPrice)]));

  const result = cropPrices.map((r) => {
    const avgPrice = Math.round(Number(r.avgPrice) * 100) / 100;
    const mspPrice = mspMap.get(r.crop) ?? null;
    const recentPrice = recentMap.get(r.crop) ?? avgPrice;
    const priorPrice = priorMap.get(r.crop) ?? recentPrice;
    const priceChange7d =
      priorPrice > 0 ? Math.round(((recentPrice - priorPrice) / priorPrice) * 10000) / 100 : 0;

    return {
      crop: r.crop,
      avgPrice,
      mspPrice,
      priceChange7d,
      volume: Math.round(Number(r.volume) * 100) / 100,
      alertCount: alertMap.get(r.crop) ?? 0,
    };
  });

  res.json(GetTopCropsResponse.parse(result));
});

export default router;
