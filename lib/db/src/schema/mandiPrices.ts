import { pgTable, text, serial, timestamp, numeric, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mandiPricesTable = pgTable(
  "mandi_prices",
  {
    id: serial("id").primaryKey(),
    crop: text("crop").notNull(),
    variety: text("variety").notNull().default("General"),
    market: text("market").notNull(),
    state: text("state").notNull(),
    district: text("district").notNull(),
    minPrice: numeric("min_price", { precision: 10, scale: 2 }).notNull(),
    maxPrice: numeric("max_price", { precision: 10, scale: 2 }).notNull(),
    modalPrice: numeric("modal_price", { precision: 10, scale: 2 }).notNull(),
    arrivals: numeric("arrivals", { precision: 12, scale: 2 }),
    priceDate: text("price_date").notNull(),
    source: text("source").notNull().default("data.gov.in"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("mandi_prices_unique_record").on(
      table.market,
      table.crop,
      table.variety,
      table.priceDate,
    ),
  ],
);

export const insertMandiPriceSchema = createInsertSchema(mandiPricesTable).omit({ id: true, createdAt: true });
export type InsertMandiPrice = z.infer<typeof insertMandiPriceSchema>;
export type MandiPrice = typeof mandiPricesTable.$inferSelect;
