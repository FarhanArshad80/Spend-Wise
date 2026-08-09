import { pgTable, text, serial, numeric, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recurringTransactionsTable = pgTable("recurring_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  categoryId: serial("category_id").notNull(),
  recurringDay: serial("recurring_day").notNull(), // day of month 1-31
  note: text("note"),
  isActive: boolean("is_active").notNull().default(true),
  lastProcessedDate: date("last_processed_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRecurringSchema = createInsertSchema(recurringTransactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRecurring = z.infer<typeof insertRecurringSchema>;
export type RecurringTransaction = typeof recurringTransactionsTable.$inferSelect;
