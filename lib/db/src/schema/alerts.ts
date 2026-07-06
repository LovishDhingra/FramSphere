import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  crop: text("crop").notNull(),
  market: text("market").notNull(),
  state: text("state").notNull(),
  severity: text("severity").notNull().default("medium"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedFarmers: integer("affected_farmers"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  isResolved: boolean("is_resolved").notNull().default(false),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
