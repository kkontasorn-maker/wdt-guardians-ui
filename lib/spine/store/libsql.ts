/**
 * Turso / libSQL remote store for Soft Launch on Vercel.
 * Same SQLite schema as better-sqlite3 local file store.
 */

import { createClient, type Client } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../schema";
import type {
  MemberRecord,
  MemberWithSubscription,
  PaymentAttemptRecord,
  SubscriptionRecord,
} from "../types";
import type { MembershipStore } from "./memory";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  guardian_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  founding INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id),
  plan_id TEXT NOT NULL,
  interval TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  amount_thb INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  activated_at TEXT,
  cancelled_at TEXT,
  current_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS payment_attempts (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  member_id TEXT NOT NULL REFERENCES members(id),
  amount_thb INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'created',
  payment_method TEXT,
  gateway_charge_id TEXT,
  gateway_event_id TEXT UNIQUE,
  failure_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

async function ensureSchema(client: Client) {
  await client.executeMultiple(SCHEMA_SQL);
  try {
    await client.execute(
      `ALTER TABLE payment_attempts ADD COLUMN payment_method TEXT`
    );
  } catch {
    /* column already exists */
  }
}

function rowToMember(row: typeof schema.members.$inferSelect): MemberRecord {
  return {
    id: row.id,
    guardianId: row.guardianId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    locale: row.locale as MemberRecord["locale"],
    founding: Boolean(row.founding),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToSub(row: typeof schema.subscriptions.$inferSelect): SubscriptionRecord {
  return {
    id: row.id,
    memberId: row.memberId,
    planId: row.planId as SubscriptionRecord["planId"],
    interval: row.interval as SubscriptionRecord["interval"],
    status: row.status as SubscriptionRecord["status"],
    amountThb: row.amountThb,
    currency: "THB",
    activatedAt: row.activatedAt,
    cancelledAt: row.cancelledAt,
    currentPeriodEnd: row.currentPeriodEnd,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToPayment(
  row: typeof schema.paymentAttempts.$inferSelect
): PaymentAttemptRecord {
  const method = row.paymentMethod;
  return {
    id: row.id,
    subscriptionId: row.subscriptionId,
    memberId: row.memberId,
    amountThb: row.amountThb,
    currency: "THB",
    status: row.status as PaymentAttemptRecord["status"],
    paymentMethod: method === "card" || method === "promptpay" ? method : null,
    gatewayChargeId: row.gatewayChargeId,
    gatewayEventId: row.gatewayEventId,
    failureCode: row.failureCode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createLibsqlStore(databaseUrl: string): Promise<MembershipStore> {
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;
  const client = createClient({ url: databaseUrl, authToken });
  await ensureSchema(client);
  const db = drizzle(client, { schema });

  return {
    mode: "libsql",

    async createMember(member) {
      await db.insert(schema.members).values({
        id: member.id,
        guardianId: member.guardianId,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        locale: member.locale,
        founding: member.founding,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      });
      return member;
    },

    async updateMember(member) {
      await db
        .update(schema.members)
        .set({
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
          phone: member.phone,
          locale: member.locale,
          founding: member.founding,
          updatedAt: member.updatedAt,
        })
        .where(eq(schema.members.id, member.id));
      return member;
    },

    async getMemberById(id) {
      const rows = await db
        .select()
        .from(schema.members)
        .where(eq(schema.members.id, id))
        .limit(1);
      const row = rows[0];
      return row ? rowToMember(row) : null;
    },

    async getMemberByGuardianId(guardianId): Promise<MemberWithSubscription | null> {
      const rows = await db
        .select()
        .from(schema.members)
        .where(eq(schema.members.guardianId, guardianId))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      const member = rowToMember(row);
      const subs = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.memberId, member.id))
        .limit(1);
      const sub = subs[0];
      return { member, subscription: sub ? rowToSub(sub) : null };
    },

    async createSubscription(sub) {
      await db.insert(schema.subscriptions).values({
        id: sub.id,
        memberId: sub.memberId,
        planId: sub.planId,
        interval: sub.interval,
        status: sub.status,
        amountThb: sub.amountThb,
        currency: sub.currency,
        activatedAt: sub.activatedAt,
        cancelledAt: sub.cancelledAt,
        currentPeriodEnd: sub.currentPeriodEnd,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      });
      return sub;
    },

    async getSubscription(id) {
      const rows = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.id, id))
        .limit(1);
      const row = rows[0];
      return row ? rowToSub(row) : null;
    },

    async updateSubscription(sub) {
      await db
        .update(schema.subscriptions)
        .set({
          status: sub.status,
          activatedAt: sub.activatedAt,
          cancelledAt: sub.cancelledAt,
          currentPeriodEnd: sub.currentPeriodEnd,
          updatedAt: sub.updatedAt,
        })
        .where(eq(schema.subscriptions.id, sub.id));
      return sub;
    },

    async createPaymentAttempt(attempt) {
      await db.insert(schema.paymentAttempts).values({
        id: attempt.id,
        subscriptionId: attempt.subscriptionId,
        memberId: attempt.memberId,
        amountThb: attempt.amountThb,
        currency: attempt.currency,
        status: attempt.status,
        paymentMethod: attempt.paymentMethod,
        gatewayChargeId: attempt.gatewayChargeId,
        gatewayEventId: attempt.gatewayEventId,
        failureCode: attempt.failureCode,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
      });
      return attempt;
    },

    async getPaymentAttemptByGatewayEventId(gatewayEventId) {
      const rows = await db
        .select()
        .from(schema.paymentAttempts)
        .where(eq(schema.paymentAttempts.gatewayEventId, gatewayEventId))
        .limit(1);
      const row = rows[0];
      return row ? rowToPayment(row) : null;
    },

    async getPaymentAttempt(id) {
      const rows = await db
        .select()
        .from(schema.paymentAttempts)
        .where(eq(schema.paymentAttempts.id, id))
        .limit(1);
      const row = rows[0];
      return row ? rowToPayment(row) : null;
    },

    async updatePaymentAttempt(attempt) {
      await db
        .update(schema.paymentAttempts)
        .set({
          status: attempt.status,
          paymentMethod: attempt.paymentMethod,
          gatewayChargeId: attempt.gatewayChargeId,
          gatewayEventId: attempt.gatewayEventId,
          failureCode: attempt.failureCode,
          updatedAt: attempt.updatedAt,
        })
        .where(eq(schema.paymentAttempts.id, attempt.id));
      return attempt;
    },

    async findPendingAttemptByChargeId(gatewayChargeId) {
      const rows = await db.select().from(schema.paymentAttempts);
      const match = rows.find(
        (p) =>
          p.gatewayChargeId === gatewayChargeId &&
          (p.status === "created" || p.status === "pending")
      );
      return match ? rowToPayment(match) : null;
    },

    async findPendingAttemptBySubscription(subscriptionId) {
      const rows = await db.select().from(schema.paymentAttempts);
      const match = rows.find(
        (p) =>
          p.subscriptionId === subscriptionId &&
          (p.status === "created" || p.status === "pending")
      );
      return match ? rowToPayment(match) : null;
    },

    async listPaymentAttempts() {
      const rows = await db.select().from(schema.paymentAttempts);
      return rows
        .map(rowToPayment)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async appendAudit(event) {
      await db.insert(schema.auditEvents).values({
        id: event.id,
        actor: event.actor,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        payloadJson: event.payloadJson,
        createdAt: event.createdAt,
      });
      return event;
    },
  };
}
