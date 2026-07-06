import { Router, type IRouter } from "express";
import { and, eq, desc, sql } from "drizzle-orm";
import { db, mandiPricesTable, mspTable, anomaliesTable } from "@workspace/db";
import {
  AnalyzeFairnessBody,
  AnalyzeFairnessResponse,
  ListAnomaliesQueryParams,
  ListAnomaliesResponse,
} from "@workspace/api-zod";
import { calculateFairnessScore } from "../lib/rag";
import { ragQuery } from "../lib/rag";

const router: IRouter = Router();

router.post("/fairness/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeFairnessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { crop, market, state, offeredPrice } = parsed.data;

  // Get mandi modal price for this crop + market
  const priceRows = await db
    .select({
      modalPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
    })
    .from(mandiPricesTable)
    .where(and(eq(mandiPricesTable.crop, crop), eq(mandiPricesTable.market, market)))
    .limit(1);

  // Fallback: state-wide average if no market-specific data
  let mandiModalPrice: number;
  if (!priceRows[0]?.modalPrice) {
    const stateRows = await db
      .select({
        modalPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
      })
      .from(mandiPricesTable)
      .where(and(eq(mandiPricesTable.crop, crop), eq(mandiPricesTable.state, state)));
    mandiModalPrice = stateRows[0]?.modalPrice ? Number(stateRows[0].modalPrice) : offeredPrice * 1.1;
  } else {
    mandiModalPrice = Number(priceRows[0].modalPrice);
  }

  // Get MSP for this crop
  const mspRows = await db
    .select()
    .from(mspTable)
    .where(eq(mspTable.crop, crop))
    .limit(1);
  const mspPrice = mspRows.length > 0 ? Number(mspRows[0].mspPrice) : null;

  const fairness = calculateFairnessScore(offeredPrice, mandiModalPrice, mspPrice);

  // Generate a natural language explanation using RAG + LLM
  const query = `A farmer in ${state} is being offered Rs. ${offeredPrice} per quintal for ${crop} at ${market}. The mandi modal price is Rs. ${mandiModalPrice.toFixed(0)}.${mspPrice ? ` The MSP is Rs. ${mspPrice}.` : ""} Is this a fair price? Explain the price difference and give advice.`;

  const ragResult = await ragQuery(query, { crop, market, state });

  // Record anomaly if suspicious or exploitative
  if (fairness.verdict !== "fair") {
    await db.insert(anomaliesTable).values({
      crop,
      market,
      state,
      reportedPrice: String(offeredPrice),
      expectedPrice: String(Math.round(mandiModalPrice * 100) / 100),
      deviationPct: String(Math.abs(fairness.deviationFromMandi)),
      anomalyScore: String(fairness.anomalyScore),
      severity: fairness.verdict === "exploitative" ? "high" : "medium",
    });
  }

  const result = {
    offeredPrice,
    mandiModalPrice: Math.round(mandiModalPrice * 100) / 100,
    mspPrice,
    deviationFromMandi: fairness.deviationFromMandi,
    deviationFromMsp: fairness.deviationFromMsp,
    anomalyScore: fairness.anomalyScore,
    verdict: fairness.verdict,
    explanation: ragResult.answer,
    recommendation:
      fairness.verdict === "exploitative"
        ? "Do not sell at this price. Contact nearby APMC mandi or use e-NAM platform immediately."
        : fairness.verdict === "suspicious"
          ? "Negotiate for a better price. Compare with 2-3 nearby mandis before deciding."
          : "This price is within acceptable range. Proceed with the transaction.",
  };

  res.json(AnalyzeFairnessResponse.parse(result));
});

router.get("/fairness/anomalies", async (req, res): Promise<void> => {
  const parsed = ListAnomaliesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { state, crop } = parsed.data;

  const conditions = [];
  if (state) conditions.push(eq(anomaliesTable.state, state));
  if (crop) conditions.push(eq(anomaliesTable.crop, crop));

  const rows = await db
    .select()
    .from(anomaliesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(anomaliesTable.detectedAt))
    .limit(50);

  const result = rows.map((r) => ({
    ...r,
    reportedPrice: Number(r.reportedPrice),
    expectedPrice: Number(r.expectedPrice),
    deviationPct: Number(r.deviationPct),
    anomalyScore: Number(r.anomalyScore),
    detectedAt: r.detectedAt.toISOString(),
    severity: r.severity as "low" | "medium" | "high" | "critical",
  }));

  res.json(ListAnomaliesResponse.parse(result));
});

export default router;
