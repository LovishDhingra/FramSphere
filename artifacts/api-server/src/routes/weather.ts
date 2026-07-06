import { Router, type IRouter } from "express";
import { and, eq, sql, desc } from "drizzle-orm";
import { db, mandiPricesTable, marketsTable } from "@workspace/db";
import { GetWeatherPricePredictionQueryParams, GetWeatherPricePredictionResponse } from "@workspace/api-zod";
import { geocodeIndianLocation, fetchForecast, type DailyForecast } from "../lib/openMeteo";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function describeWeather(day: DailyForecast): string {
  if (day.precipitationMm >= 30) return "Heavy rainfall forecast";
  if (day.precipitationMm >= 10) return "Moderate rainfall expected";
  if (day.precipitationMm > 0) return "Light showers possible";
  if (day.tempMax >= 40) return "Severe heat stress conditions";
  if (day.tempMax >= 35) return "Heat stress conditions";
  if (day.tempMin <= 8) return "Cold wave approaching";
  return "Normal, clear conditions";
}

/** Estimates a same-day price impact multiplier from real weather (heavy rain/heat disrupt arrivals and raise prices; normal weather is neutral). */
function weatherImpactFactor(day: DailyForecast): number {
  if (day.precipitationMm >= 30) return 1.04;
  if (day.precipitationMm >= 10) return 1.015;
  if (day.tempMax >= 40) return 1.02;
  if (day.tempMin <= 8) return 1.01;
  return 1.0;
}

/**
 * Weather-based price prediction endpoint.
 * Combines real historical price trends (data.gov.in) with a real 7-day
 * weather forecast (Open-Meteo) for the market's geocoded location — no
 * simulated weather data.
 */
router.get("/weather/prediction", async (req, res): Promise<void> => {
  const parsed = GetWeatherPricePredictionQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { crop, market, days } = parsed.data;
  const forecastDays = days ?? 7;

  // Get recent price trend
  const recentPrices = await db
    .select({
      date: mandiPricesTable.priceDate,
      modalPrice: sql<string>`AVG(${mandiPricesTable.modalPrice}::numeric)`,
    })
    .from(mandiPricesTable)
    .where(and(eq(mandiPricesTable.crop, crop), eq(mandiPricesTable.market, market)))
    .groupBy(mandiPricesTable.priceDate)
    .orderBy(desc(mandiPricesTable.priceDate))
    .limit(30);

  const currentPrice =
    recentPrices.length > 0
      ? Number(recentPrices[0].modalPrice)
      : 2000;

  // Compute trend from last 7 days vs prior 7 days
  const recent7 = recentPrices.slice(0, 7).map((r: { modalPrice: string }) => Number(r.modalPrice));
  const prior7 = recentPrices.slice(7, 14).map((r: { modalPrice: string }) => Number(r.modalPrice));
  const recentAvg = recent7.length > 0 ? recent7.reduce((a: number, b: number) => a + b, 0) / recent7.length : currentPrice;
  const priorAvg = prior7.length > 0 ? prior7.reduce((a: number, b: number) => a + b, 0) / prior7.length : currentPrice;
  const weeklyTrend = priorAvg > 0 ? (recentAvg - priorAvg) / priorAvg : 0;

  // Resolve the market's real GPS location so we can pull a real forecast for it
  const marketRow = await db
    .select({ latitude: marketsTable.latitude, longitude: marketsTable.longitude, district: marketsTable.district, state: marketsTable.state })
    .from(marketsTable)
    .where(eq(marketsTable.name, market))
    .limit(1);

  let point = marketRow[0]?.latitude != null && marketRow[0]?.longitude != null
    ? { latitude: Number(marketRow[0].latitude), longitude: Number(marketRow[0].longitude) }
    : null;

  if (!point) {
    point = await geocodeIndianLocation(market, marketRow[0] ? `${marketRow[0].district}, ${marketRow[0].state}` : `${market}, India`);
  }

  let forecast: DailyForecast[] = [];
  if (point) {
    try {
      forecast = await fetchForecast(point, forecastDays);
    } catch (err) {
      logger.warn({ err, market }, "failed to fetch live weather forecast");
    }
  }

  const predictions = Array.from({ length: forecastDays }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const day = forecast[i];

    const trendFactor = 1 + weeklyTrend * ((i + 1) / 7);
    const weatherFactorMultiplier = day ? weatherImpactFactor(day) : 1.0;
    const predictedPrice = Math.round(currentPrice * trendFactor * weatherFactorMultiplier * 100) / 100;

    // Confidence decreases with forecast horizon; real forecast data raises confidence
    const confidence = Math.max(0.5, (day ? 0.95 : 0.75) - i * 0.06);

    return {
      date: date.toISOString().split("T")[0],
      predictedPrice,
      confidence: Math.round(confidence * 100) / 100,
      weatherFactor: day ? describeWeather(day) : "Forecast unavailable for this market",
    };
  });

  const trend = weeklyTrend > 0.05 ? "rising" : weeklyTrend < -0.05 ? "falling" : "stable";
  const weatherSummary = forecast.length > 0
    ? `${crop} prices at ${market} are currently ${trend}. Live 7-day weather forecast shows conditions ranging from ${Math.min(...forecast.map((d) => d.tempMin))}°C to ${Math.max(...forecast.map((d) => d.tempMax))}°C with up to ${Math.max(...forecast.map((d) => d.precipitationMm))}mm rainfall on peak days.`
    : `${crop} prices at ${market} are currently ${trend}. Live weather data was unavailable for this market's location.`;

  const recommendedAction =
    trend === "rising"
      ? `Prices are expected to rise. Consider holding stock for 3-5 days to maximize returns.`
      : trend === "falling"
        ? `Prices may decline. Sell within the next 1-2 days to avoid losses.`
        : `Prices are stable. Sell at current market rates or hold if storage costs are low.`;

  const result = {
    crop,
    market,
    currentPrice,
    predictions,
    weatherSummary,
    recommendedAction,
  };

  res.json(GetWeatherPricePredictionResponse.parse(result));
});

export default router;
