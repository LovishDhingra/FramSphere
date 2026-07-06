import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const schemesTable = pgTable("government_schemes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ministry: text("ministry").notNull(),
  description: text("description").notNull(),
  eligibility: text("eligibility").notNull(),
  benefit: text("benefit").notNull(),
  applicationUrl: text("application_url"),
  applicableCrops: text("applicable_crops").array().notNull().default([]),
  applicableStates: text("applicable_states").array().notNull().default([]),
  deadline: text("deadline"),
});

export const insertSchemeSchema = createInsertSchema(schemesTable).omit({ id: true });
export type InsertScheme = z.infer<typeof insertSchemeSchema>;
export type Scheme = typeof schemesTable.$inferSelect;
