import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userSettingsTable = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  currency: text("currency").notNull().default("PKR"),
  weeklyEmailEnabled: boolean("weekly_email_enabled").notNull().default(true),
  defaultView: text("default_view").notNull().default("dashboard"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable).omit({ createdAt: true, updatedAt: true });
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettingsTable.$inferSelect;
