/**
 * Soft Launch shared admin book.
 * Seeded once from lib/mockData; live spine joins can append.
 * Persists to data/admin-book.json when possible.
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
  type AuditEvent,
  type BoothSignupSeed,
  type CrmContact,
  type FailedPayment,
  type MockMember,
  type MockPayment,
  type MockSubscription,
} from "@/lib/mockData";

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
