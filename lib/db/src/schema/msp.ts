import { pgTable, text, serial, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mspTable = pgTable("msp_records", {
  id: serial("id").primaryKey(),
  crop: text("crop").notNull(),
  variety: text("variety"),
  mspPrice: numeric("msp_price", { precision: 10, scale: 2 }).notNull(),
  season: text("season").notNull(),
  year: integer("year").notNull(),
  announcedBy: text("announced_by").notNull().default("Government of India"),
});

export const insertMspSchema = createInsertSchema(mspTable).omit({ id: true });
export type InsertMsp = z.infer<typeof insertMspSchema>;
export type Msp = typeof mspTable.$inferSelect;
