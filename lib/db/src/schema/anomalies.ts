import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const anomaliesTable = pgTable("price_anomalies", {
  id: serial("id").primaryKey(),
  crop: text("crop").notNull(),
  market: text("market").notNull(),
  state: text("state").notNull(),
  reportedPrice: numeric("reported_price", { precision: 10, scale: 2 }).notNull(),
  expectedPrice: numeric("expected_price", { precision: 10, scale: 2 }).notNull(),
  deviationPct: numeric("deviation_pct", { precision: 6, scale: 2 }).notNull(),
  anomalyScore: numeric("anomaly_score", { precision: 5, scale: 3 }).notNull(),
  severity: text("severity").notNull().default("medium"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnomalySchema = createInsertSchema(anomaliesTable).omit({ id: true, detectedAt: true });
export type InsertAnomaly = z.infer<typeof insertAnomalySchema>;
export type Anomaly = typeof anomaliesTable.$inferSelect;
