import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema";
import type {
  MemberRecord,
  MemberWithSubscription,
  PaymentAttemptRecord,
  SubscriptionRecord,
} from "../types";
import type { MembershipStore } from "./memory";

function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
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
  `);
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
  return {
    id: row.id,
    subscriptionId: row.subscriptionId,
    memberId: row.memberId,
    amountThb: row.amountThb,
    currency: "THB",
    status: row.status as PaymentAttemptRecord["status"],
    gatewayChargeId: row.gatewayChargeId,
    gatewayEventId: row.gatewayEventId,
    failureCode: row.failureCode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createSqliteStore(databaseUrl: string): MembershipStore {
  const path = databaseUrl.replace(/^file:/, "").replace(/^sqlite:/, "");
  const sqlite = new Database(path || ":memory:");
  ensureSchema(sqlite);
  const db = drizzle(sqlite, { schema });

  return {
    mode: "sqlite",

    async createMember(member) {
      db.insert(schema.members)
        .values({
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
        })
        .run();
      return member;
    },

    async getMemberById(id) {
      const row = db.select().from(schema.members).where(eq(schema.members.id, id)).get();
      return row ? rowToMember(row) : null;
    },

    async getMemberByGuardianId(guardianId): Promise<MemberWithSubscription | null> {
      const row = db
        .select()
        .from(schema.members)
        .where(eq(schema.members.guardianId, guardianId))
        .get();
      if (!row) return null;
      const member = rowToMember(row);
      const sub = db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.memberId, member.id))
        .get();
      return { member, subscription: sub ? rowToSub(sub) : null };
    },

    async createSubscription(sub) {
      db.insert(schema.subscriptions)
        .values({
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
        })
        .run();
      return sub;
    },

    async getSubscription(id) {
      const row = db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.id, id))
        .get();
      return row ? rowToSub(row) : null;
    },

    async updateSubscription(sub) {
      db.update(schema.subscriptions)
        .set({
          status: sub.status,
          activatedAt: sub.activatedAt,
          cancelledAt: sub.cancelledAt,
          currentPeriodEnd: sub.currentPeriodEnd,
          updatedAt: sub.updatedAt,
        })
        .where(eq(schema.subscriptions.id, sub.id))
        .run();
      return sub;
    },

    async createPaymentAttempt(attempt) {
      db.insert(schema.paymentAttempts)
        .values({
          id: attempt.id,
          subscriptionId: attempt.subscriptionId,
          memberId: attempt.memberId,
          amountThb: attempt.amountThb,
          currency: attempt.currency,
          status: attempt.status,
          gatewayChargeId: attempt.gatewayChargeId,
          gatewayEventId: attempt.gatewayEventId,
          failureCode: attempt.failureCode,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
        })
        .run();
      return attempt;
    },

    async getPaymentAttemptByGatewayEventId(gatewayEventId) {
      const row = db
        .select()
        .from(schema.paymentAttempts)
        .where(eq(schema.paymentAttempts.gatewayEventId, gatewayEventId))
        .get();
      return row ? rowToPayment(row) : null;
    },

    async getPaymentAttempt(id) {
      const row = db
        .select()
        .from(schema.paymentAttempts)
        .where(eq(schema.paymentAttempts.id, id))
        .get();
      return row ? rowToPayment(row) : null;
    },

    async updatePaymentAttempt(attempt) {
      db.update(schema.paymentAttempts)
        .set({
          status: attempt.status,
          gatewayChargeId: attempt.gatewayChargeId,
          gatewayEventId: attempt.gatewayEventId,
          failureCode: attempt.failureCode,
          updatedAt: attempt.updatedAt,
        })
        .where(eq(schema.paymentAttempts.id, attempt.id))
        .run();
      return attempt;
    },

    async findPendingAttemptByChargeId(gatewayChargeId) {
      const rows = db.select().from(schema.paymentAttempts).all();
      const match = rows.find(
        (p) =>
          p.gatewayChargeId === gatewayChargeId &&
          (p.status === "created" || p.status === "pending")
      );
      return match ? rowToPayment(match) : null;
    },

    async findPendingAttemptBySubscription(subscriptionId) {
      const rows = db.select().from(schema.paymentAttempts).all();
      const match = rows.find(
        (p) =>
          p.subscriptionId === subscriptionId &&
          (p.status === "created" || p.status === "pending")
      );
      return match ? rowToPayment(match) : null;
    },

    async appendAudit(event) {
      db.insert(schema.auditEvents)
        .values({
          id: event.id,
          actor: event.actor,
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId,
          payloadJson: event.payloadJson,
          createdAt: event.createdAt,
        })
        .run();
      return event;
    },
  };
}
