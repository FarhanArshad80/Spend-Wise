import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const budgetAlertsTable = pgTable("budget_alerts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull().default("overall"), // 'overall' | 'category'
  categoryId: serial("category_id"),
  threshold: numeric("threshold", { precision: 5, scale: 2 }).notNull(), // 0-100 percentage
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBudgetAlertSchema = createInsertSchema(budgetAlertsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBudgetAlert = z.infer<typeof insertBudgetAlertSchema>;
export type BudgetAlert = typeof budgetAlertsTable.$inferSelect;
