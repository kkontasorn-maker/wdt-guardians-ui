/**
 * Soft Launch shared admin book.
 * Seeded once from lib/mockData; live spine joins / payments can append.
 * Persists to data/admin-book.json when possible (local). On Vercel, prefer
 * Turso spine as source of truth — GET /api/admin/book merges live attempts.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import {
  AUDIT_EVENTS,
  BOOTH_QUEUE,
  CRM_CONTACTS,
  DASHBOARD_STATS,
  FAILED_PAYMENTS,
  FOUNDING_CAMPAIGN,
  FOUNDING_MEMBERS,
  MEMBERS,
  PAYMENTS,
  SUBSCRIPTIONS,
  failedPaymentCount,
  pendingPaymentCount,
  recentMembers,
  retryStageFromDays,
  type AuditEvent,
  type BoothSignupSeed,
  type CrmContact,
  type FailedPayment,
  type MockMember,
  type MockPayment,
  type MockSubscription,
  type PaymentMethodLabel,
  type PaymentStatus,
} from "@/lib/mockData";
import type { PaymentAttemptRecord } from "@/lib/spine/types";
import { getStore } from "@/lib/spine/store";

export type AdminBook = {
  asOf: string;
  foundingCampaign: typeof FOUNDING_CAMPAIGN;
  members: MockMember[];
  payments: MockPayment[];
  subscriptions: MockSubscription[];
  failedPayments: FailedPayment[];
  crmContacts: CrmContact[];
  foundingMembers: MockMember[];
  boothQueue: BoothSignupSeed[];
  auditEvents: AuditEvent[];
  dashboardStats: typeof DASHBOARD_STATS;
  failedPaymentCount: number;
  pendingPaymentCount: number;
  recentMembers: MockMember[];
  source: "seed" | "file";
};

const DATA_PATH = join(process.cwd(), "data", "admin-book.json");

let cached: AdminBook | null = null;

function buildFromSeed(): AdminBook {
  return {
    asOf: "2026-09-19",
    foundingCampaign: FOUNDING_CAMPAIGN,
    members: [...MEMBERS],
    payments: [...PAYMENTS],
    subscriptions: [...SUBSCRIPTIONS],
    failedPayments: [...FAILED_PAYMENTS],
    crmContacts: [...CRM_CONTACTS],
    foundingMembers: [...FOUNDING_MEMBERS],
    boothQueue: [...BOOTH_QUEUE],
    auditEvents: [...AUDIT_EVENTS],
    dashboardStats: [...DASHBOARD_STATS],
    failedPaymentCount,
    pendingPaymentCount,
    recentMembers: [...recentMembers],
    source: "seed",
  };
}

function recompute(book: AdminBook): AdminBook {
  const active = book.members.filter((m) => m.status === "Active");
  const failed = book.payments.filter((p) => p.status === "Failed").length;
  const pending = book.payments.filter((p) => p.status === "Pending").length;
  book.failedPaymentCount = failed;
  book.pendingPaymentCount = pending;
  book.foundingMembers = [...book.members]
    .filter((m) => m.founding)
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  book.crmContacts = book.members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    lastContact: m.lastContact,
    notes: m.notes,
  }));
  book.recentMembers = [...book.members]
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
    .slice(0, 8);
  book.dashboardStats = [
    {
      label: "Active Members",
      value: active.length.toLocaleString("en-US"),
      trend: `${book.members.length} in this book`,
      tone: "up",
    },
    book.dashboardStats[1] ?? {
      label: "MRR",
      value: "—",
      trend: "see subscriptions",
      tone: "muted",
    },
    book.dashboardStats[2] ?? {
      label: "New — 30 days",
      value: "—",
      trend: "",
      tone: "muted",
    },
    {
      label: "Needs action",
      value: String(failed + pending),
      trend: `${failed} failed + ${pending} pending`,
      tone: "muted",
    },
  ];
  return book;
}

function persist(book: AdminBook) {
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(DATA_PATH, JSON.stringify(book, null, 2), "utf8");
  } catch (err) {
    console.warn("[admin-book] persist failed", err);
  }
}

export function getAdminBook(): AdminBook {
  if (cached) return cached;

  if (existsSync(DATA_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(DATA_PATH, "utf8")) as AdminBook;
      cached = recompute({ ...parsed, source: "file" });
      return cached;
    } catch {
      /* fall through to seed */
    }
  }

  cached = recompute(buildFromSeed());
  persist(cached);
  return cached;
}

export function resetAdminBookFromSeed(): AdminBook {
  cached = recompute(buildFromSeed());
  persist(cached);
  return cached;
}

/** Soft Launch: update name/email on an existing admin-book member (by id). */
export function updateAdminMemberContact(input: {
  id: string;
  name: string;
  email: string;
}): AdminBook {
  const book = getAdminBook();
  const idx = book.members.findIndex(
    (m) => m.id.toUpperCase() === input.id.trim().toUpperCase()
  );
  if (idx < 0) return book;

  const prev = book.members[idx];
  book.members[idx] = {
    ...prev,
    name: input.name.trim() || prev.name,
    email: input.email.trim().toLowerCase() || prev.email,
    lastContact: new Date().toISOString().slice(0, 10),
    notes: prev.notes?.includes("Profile updated")
      ? prev.notes
      : [prev.notes, "Profile updated"].filter(Boolean).join(" · "),
  };

  book.auditEvents.unshift({
    id: `aud-profile-${Date.now()}`,
    at: new Date().toISOString(),
    actor: "System",
    action: `Profile contact updated: ${input.id}`,
  });

  cached = recompute(book);
  persist(cached);
  return cached;
}

/** Append a live Guardian after join/activation (idempotent by id). */
export function upsertLiveMember(input: {
  id: string;
  name: string;
  email: string;
  plan: MockMember["plan"];
  status: MockMember["status"];
  joinedAt: string;
  nextRenewal: string | null;
  channel?: MockMember["channel"];
  founding?: boolean;
}): AdminBook {
  const book = getAdminBook();
  const existing = book.members.findIndex((m) => m.id === input.id);
  const row: MockMember = {
    id: input.id,
    name: input.name,
    email: input.email,
    plan: input.plan,
    status: input.status,
    joinedAt: input.joinedAt.slice(0, 10),
    nextRenewal: input.nextRenewal ? input.nextRenewal.slice(0, 10) : null,
    channel: input.channel ?? "desktop",
    founding: Boolean(input.founding),
    lastContact: input.joinedAt.slice(0, 10),
    notes: "Live Soft Launch join",
  };
  if (existing >= 0) book.members[existing] = row;
  else book.members.unshift(row);

  book.auditEvents.unshift({
    id: `aud-live-${Date.now()}`,
    at: new Date().toISOString(),
    actor: "System",
    action: `Live member upsert: ${input.id} → ${input.status}`,
  });

  cached = recompute(book);
  persist(cached);
  return cached;
}

function attemptStatusToUi(status: PaymentAttemptRecord["status"]): PaymentStatus | null {
  if (status === "successful") return "Success";
  if (status === "failed") return "Failed";
  if (status === "pending" || status === "created") return "Pending";
  return null; // ignored
}

function attemptMethodToUi(
  method: PaymentAttemptRecord["paymentMethod"]
): PaymentMethodLabel {
  if (method === "promptpay") return "PromptPay";
  return "Card";
}

function failureReasonLabel(code: string | null): FailedPayment["reason"] {
  const c = (code ?? "").toLowerCase();
  if (c.includes("insufficient")) return "Insufficient funds";
  if (c.includes("expired")) return "Expired card";
  return "Card declined";
}

function daysSince(iso: string): number {
  const day = iso.slice(0, 10);
  const from = Date.parse(`${day}T00:00:00`);
  const to = Date.now();
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

/** Record a live gateway attempt in the book (idempotent by attempt id). */
export function upsertLivePayment(input: {
  id: string;
  guardianId: string;
  amount: number;
  method: PaymentMethodLabel;
  status: PaymentStatus;
  date: string;
  failureCode?: string | null;
}): AdminBook {
  const book = getAdminBook();
  const date = input.date.slice(0, 10);
  const row: MockPayment = {
    id: input.id,
    date,
    guardianId: input.guardianId,
    amount: input.amount,
    method: input.method,
    status: input.status,
  };
  const idx = book.payments.findIndex((p) => p.id === input.id);
  if (idx >= 0) book.payments[idx] = row;
  else book.payments.unshift(row);

  if (input.status === "Failed") {
    const days = daysSince(date);
    const failRow: FailedPayment = {
      id: input.id,
      guardianId: input.guardianId,
      amount: input.amount,
      reason: failureReasonLabel(input.failureCode ?? null),
      failedOn: date,
      daysSinceFailure: days,
      retryStage: retryStageFromDays(days),
    };
    const fIdx = book.failedPayments.findIndex((f) => f.id === input.id);
    if (fIdx >= 0) book.failedPayments[fIdx] = failRow;
    else book.failedPayments.unshift(failRow);
  } else {
    book.failedPayments = book.failedPayments.filter((f) => f.id !== input.id);
  }

  book.auditEvents.unshift({
    id: `aud-pay-${Date.now()}`,
    at: new Date().toISOString(),
    actor: "System",
    action: `Live payment: ${input.id} → ${input.status} (${input.guardianId})`,
  });

  cached = recompute(book);
  persist(cached);
  return cached;
}

/**
 * Merge spine payment_attempts into the admin book for Payments / Failed / KPIs.
 * Live rows win on id collision; seed demo rows remain for Soft Launch UX.
 */
export async function getAdminBookWithLivePayments(): Promise<AdminBook> {
  const book = getAdminBook();
  try {
    const store = await getStore();
    const attempts = await store.listPaymentAttempts();
    if (attempts.length === 0) return book;

    const livePayments: MockPayment[] = [];
    const liveFailed: FailedPayment[] = [];

    for (const attempt of attempts) {
      const uiStatus = attemptStatusToUi(attempt.status);
      if (!uiStatus) continue;
      const member = await store.getMemberById(attempt.memberId);
      const guardianId = member?.guardianId ?? "WDTG-??????";
      const date = attempt.createdAt.slice(0, 10);
      livePayments.push({
        id: attempt.id,
        date,
        guardianId,
        amount: attempt.amountThb,
        method: attemptMethodToUi(attempt.paymentMethod),
        status: uiStatus,
      });
      if (uiStatus === "Failed") {
        const days = daysSince(attempt.updatedAt || attempt.createdAt);
        liveFailed.push({
          id: attempt.id,
          guardianId,
          amount: attempt.amountThb,
          reason: failureReasonLabel(attempt.failureCode),
          failedOn: (attempt.updatedAt || attempt.createdAt).slice(0, 10),
          daysSinceFailure: days,
          retryStage: retryStageFromDays(days),
        });
      }
    }

    const liveIds = new Set(livePayments.map((p) => p.id));
    book.payments = [
      ...livePayments,
      ...book.payments.filter((p) => !liveIds.has(p.id)),
    ];
    const liveFailIds = new Set(liveFailed.map((f) => f.id));
    book.failedPayments = [
      ...liveFailed,
      ...book.failedPayments.filter((f) => !liveFailIds.has(f.id)),
    ];

    cached = recompute(book);
    return cached;
  } catch (err) {
    console.warn("[admin-book] live payment merge failed", err);
    return book;
  }
}
