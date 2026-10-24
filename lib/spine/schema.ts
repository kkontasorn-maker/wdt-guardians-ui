/**
 * Drizzle schema (SQLite dialect for local/dev).
 * Switch DATABASE_URL to postgres:// later; column shapes stay the same.
 * Plan ids live in lib/spine/plans.ts constants (no plans table for Soft Launch).
 */

import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  guardianId: text("guardian_id").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  locale: text("locale").notNull().default("en"),
  founding: integer("founding", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id),
  planId: text("plan_id").notNull(),
  interval: text("interval").notNull(),
  status: text("status").notNull().default("pending"),
  amountThb: integer("amount_thb").notNull(),
  currency: text("currency").notNull().default("THB"),
  activatedAt: text("activated_at"),
  cancelledAt: text("cancelled_at"),
  currentPeriodEnd: text("current_period_end"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const paymentAttempts = sqliteTable("payment_attempts", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id),
  amountThb: integer("amount_thb").notNull(),
  currency: text("currency").notNull().default("THB"),
  status: text("status").notNull().default("created"),
  paymentMethod: text("payment_method"),
  gatewayChargeId: text("gateway_charge_id"),
  /** Unique when set — webhook idempotency key. */
  gatewayEventId: text("gateway_event_id").unique(),
  failureCode: text("failure_code"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type MemberRow = typeof members.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type PaymentAttemptRow = typeof paymentAttempts.$inferSelect;
export type AuditEventRow = typeof auditEvents.$inferSelect;
