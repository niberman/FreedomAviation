/**
 * LEGACY DRIZZLE SCHEMA - INCOMPLETE
 * 
 * ⚠️ This file only defines a basic "users" table and is NOT in sync with the actual database.
 * 
 * For complete database type definitions, see:
 * - shared/database-types.ts (Complete TypeScript types for all 45+ tables)
 * - supabase-schema.sql (Base schema SQL)
 * - pricing-schema.sql (Pricing system tables)
 * - scripts/add-all-missing-tables-comprehensive.sql (All additional tables)
 * 
 * The actual database uses Supabase Auth (auth.users) instead of this users table.
 * User profiles are stored in public.user_profiles which references auth.users.
 * 
 * See SCHEMA_VALIDATION_REPORT.md and SCHEMA_SYNC_QUICK_START.md for details.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
