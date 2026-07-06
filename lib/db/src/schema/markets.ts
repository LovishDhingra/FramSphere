import { pgTable, text, serial, numeric, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketsTable = pgTable(
  "markets",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    state: text("state").notNull(),
    district: text("district").notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    type: text("type").notNull().default("APMC"),
  },
  (table) => [unique("markets_unique_location").on(table.name, table.state, table.district)],
);

export const insertMarketSchema = createInsertSchema(marketsTable).omit({ id: true });
export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof marketsTable.$inferSelect;
