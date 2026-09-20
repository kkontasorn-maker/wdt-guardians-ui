import { annualPrice, formatDate, formatMoney } from "@/lib/membership";

export const PAGE_SIZE = 10;
export const AS_OF = "2026-09-19";
export const FOUNDING_CAMPAIGN = { confirmed: 684, total: 1000 } as const;
export const BOOTH_DEVICES = ["Booth iPad #1", "Booth iPad #2"] as const;

export type PlanName = "WDT 199" | "WDT 399" | "WDT 999";
export type MemberStatus = "Active" | "Past Due" | "Cancelled";
export type PaymentStatus = "Success" | "Failed" | "Pending";
export type PaymentMethodLabel = "Card" | "PromptPay" | "Bank debit";
export type BillingCycle = "Monthly" | "Annual";
export type JoinChannel = "mobile" | "desktop";
export type FailReason = "Card declined" | "Insufficient funds" | "Expired card";
export type RetryStage = 1 | 3 | 7;
export type BoothDevice = (typeof BOOTH_DEVICES)[number];

type GuardianSeed = {
  id: string;
  name: string;
  plan: PlanName;
  status: MemberStatus;
  joinedAt: string;
  nextRenewal: string | null;
  cycle: BillingCycle;
  method: PaymentMethodLabel;
  payStatus: PaymentStatus;
  payDate: string;
  autoRenew: boolean;
  channel: JoinChannel;
  founding: boolean;
  lastContact: string;
  notes: string;
  failReason?: FailReason;
};

const PLAN_MONTHLY: Record<PlanName, number> = {
  "WDT 199": 199,
  "WDT 399": 399,
  "WDT 999": 999,
};

const SEEDS: GuardianSeed[] = [
  { id: "WDTG-441902", name: "Jane Srisai", plan: "WDT 399", status: "Active", joinedAt: "2026-03-12", nextRenewal: "2026-10-12", cycle: "Monthly", method: "Card", payStatus: "Success", payDate: "2026-09-12", autoRenew: true, channel: "mobile", founding: true, lastContact: "2026-09-17", notes: "Asked about the next field-response briefing." },
  { id: "WDTG-882014", name: "Somchai Prasert", plan: "WDT 199", status: "Active", joinedAt: "2025-11-03", nextRenewal: "2026-11-03", cycle: "Annual", method: "PromptPay", payStatus: "Success", payDate: "2025-11-03", autoRenew: true, channel: "desktop", founding: true, lastContact: "2026-09-04", notes: "Prefers annual receipt in Thai." },
  { id: "WDTG-109633", name: "Arun Wong", plan: "WDT 999", status: "Cancelled", joinedAt: "2025-08-19", nextRenewal: null, cycle: "Monthly", method: "Bank debit", payStatus: "Failed", payDate: "2026-08-19", autoRenew: false, channel: "desktop", founding: true, lastContact: "2026-08-20", notes: "Cancelled after card expired. Do not retry.", failReason: "Expired card" },
  { id: "WDTG-774210", name: "Mali Thongchai", plan: "WDT 399", status: "Active", joinedAt: "2026-04-28", nextRenewal: "2026-09-28", cycle: "Monthly", method: "Card", payStatus: "Success", payDate: "2026-08-28", autoRenew: true, channel: "mobile", founding: false, lastContact: "2026-09-11", notes: "Booth signup — Chiang Mai night market." },
  { id: "WDTG-330188", name: "Niran Kaew", plan: "WDT 199", status: "Past Due", joinedAt: "2026-01-21", nextRenewal: "2026-09-21", cycle: "Monthly", method: "PromptPay", payStatus: "Failed", payDate: "2026-09-18", autoRenew: true, channel: "mobile", founding: true, lastContact: "2026-09-18", notes: "PromptPay failed. Waiting on retry." , failReason: "Insufficient funds" },
  { id: "WDTG-615047", name: "Preecha Boon", plan: "WDT 399", status: "Active", joinedAt: "2025-10-19", nextRenewal: "2026-10-19", cycle: "Annual", method: "Card", payStatus: "Success", payDate: "2025-10-19", autoRenew: true, channel: "desktop", founding: true, lastContact: "2026-08-30", notes: "Founding cohort. Send Q3 impact brief." },
  { id: "WDTG-902411", name: "Siriporn Chan", plan: "WDT 999", status: "Active", joinedAt: "2026-05-08", nextRenewal: "2026-10-08", cycle: "Monthly", method: "Bank debit", payStatus: "Success", payDate: "2026-09-08", autoRenew: true, channel: "mobile", founding: false, lastContact: "2026-09-08", notes: "" },
  { id: "WDTG-257140", name: "Anan Decha", plan: "WDT 199", status: "Past Due", joinedAt: "2026-06-02", nextRenewal: "2026-09-02", cycle: "Monthly", method: "PromptPay", payStatus: "Pending", payDate: "2026-09-02", autoRenew: true, channel: "mobile", founding: false, lastContact: "2026-09-03", notes: "Pending PromptPay confirmation — do not activate." },
  { id: "WDTG-118204", name: "Kanya Suksri", plan: "WDT 399", status: "Active", joinedAt: "2026-02-14", nextRenewal: "2026-10-14", cycle: "Monthly", method: "Card", payStatus: "Success", payDate: "2026-09-14", autoRenew: true, channel: "desktop", founding: true, lastContact: "2026-09-14", notes: "Wants Case Room invite for October." },
  { id: "WDTG-603881", name: "Wit Rattan", plan: "WDT 199", status: "Active", joinedAt: "2026-07-01", nextRenewal: "2026-10-01", cycle: "Monthly", method: "Bank debit", payStatus: "Success", payDate: "2026-09-01", autoRenew: true, channel: "mobile", founding: false, lastContact: "2026-09-01", notes: "" },
  { id: "WDTG-447190", name: "Dao Prasong", plan: "WDT 999", status: "Past Due", joinedAt: "2025-09-30", nextRenewal: "2026-09-30", cycle: "Annual", method: "Card", payStatus: "Failed", payDate: "2026-09-16", autoRenew: true, channel: "desktop", founding: true, lastContact: "2026-09-16", notes: "Annual card declined. In Day 3 retry." , failReason: "Card declined" },
  { id: "WDTG-220184", name: "Lek Suphan", plan: "WDT 399", status: "Cancelled", joinedAt: "2025-12-11", nextRenewal: null, cycle: "Monthly", method: "PromptPay", payStatus: "Failed", payDate: "2026-08-11", autoRenew: false, channel: "mobile", founding: true, lastContact: "2026-08-12", notes: "Asked to stop retries." , failReason: "Card declined" },
  { id: "WDTG-881002", name: "Ying Charoen", plan: "WDT 199", status: "Active", joinedAt: "2026-08-22", nextRenewal: "2026-10-22", cycle: "Monthly", method: "Card", payStatus: "Success", payDate: "2026-09-22", autoRenew: true, channel: "mobile", founding: false, lastContact: "2026-08-22", notes: "Joined from Booth iPad #2." },
  { id: "WDTG-550391", name: "Tod Chaiyaporn", plan: "WDT 399", status: "Active", joinedAt: "2026-01-09", nextRenewal: "2027-01-09", cycle: "Annual", method: "PromptPay", payStatus: "Success", payDate: "2026-01-09", autoRenew: true, channel: "desktop", founding: true, lastContact: "2026-09-02", notes: "Founding. Annual already paid." },
  { id: "WDTG-772045", name: "Bee Nanthana", plan: "WDT 999", status: "Active", joinedAt: "2026-04-04", nextRenewal: "2026-10-04", cycle: "Monthly", method: "Card", payStatus: "Success", payDate: "2026-09-04", autoRenew: true, channel: "mobile", founding: false, lastContact: "2026-09-05", notes: "" },
  { id: "WDTG-339120", name: "Ohm Sawat", plan: "WDT 199", status: "Past Due", joinedAt: "2026-03-16", nextRenewal: "2026-09-16", cycle: "Monthly", method: "Bank debit", payStatus: "Pending", payDate: "2026-09-16", autoRenew: true, channel: "mobile", founding: true, lastContact: "2026-09-16", notes: "Bank debit pending from Kasikorn." },
  { id: "WDTG-914870", name: "Fern Jira", plan: "WDT 399", status: "Active", joinedAt: "2026-08-29", nextRenewal: "2026-10-29", cycle: "Monthly", method: "PromptPay", payStatus: "Success", payDate: "2026-09-29", autoRenew: true, channel: "mobile", founding: false, lastContact: "2026-08-29", notes: "Booth iPad #1 — Sunday market." },
  { id: "WDTG-106334", name: "Mark Ellison", plan: "WDT 199", status: "Active", joinedAt: "2025-09-01", nextRenewal: "2026-09-01", cycle: "Annual", method: "Card", payStatus: "Success", payDate: "2025-09-01", autoRenew: true, channel: "desktop", founding: true, lastContact: "2026-07-22", notes: "Overseas. Email only." },
  { id: "WDTG-628441", name: "Ploy Wichai", plan: "WDT 399", status: "Past Due", joinedAt: "2026-05-18", nextRenewal: "2026-09-18", cycle: "Monthly", method: "Bank debit", payStatus: "Failed", payDate: "2026-09-18", autoRenew: true, channel: "mobile", founding: false, lastContact: "2026-09-18", notes: "Insufficient funds on debit. Day 1 retry." , failReason: "Insufficient funds" },
  { id: "WDTG-301992", name: "Ken Nakamura", plan: "WDT 999", status: "Active", joinedAt: "2026-06-21", nextRenewal: "2026-10-21", cycle: "Monthly", method: "Card", payStatus: "Success", payDate: "2026-09-21", autoRenew: true, channel: "desktop", founding: false, lastContact: "2026-09-12", notes: "" },
  { id: "WDTG-845017", name: "Noi Siri", plan: "WDT 199", status: "Cancelled", joinedAt: "2026-02-07", nextRenewal: null, cycle: "Monthly", method: "PromptPay", payStatus: "Failed", payDate: "2026-08-07", autoRenew: false, channel: "mobile", founding: true, lastContact: "2026-08-08", notes: "Expired card. Membership cancelled." , failReason: "Expired card" },
  { id: "WDTG-192773", name: "Gift Apinya", plan: "WDT 399", status: "Active", joinedAt: "2026-09-03", nextRenewal: "2026-10-03", cycle: "Monthly", method: "Card", payStatus: "Success", payDate: "2026-09-03", autoRenew: true, channel: "desktop", founding: false, lastContact: "2026-09-03", notes: "Desktop join after the Saturday booth." },
  { id: "WDTG-477610", name: "Ton Pairote", plan: "WDT 199", status: "Active", joinedAt: "2026-09-10", nextRenewal: "2027-09-10", cycle: "Annual", method: "Bank debit", payStatus: "Pending", payDate: "2026-09-10", autoRenew: true, channel: "mobile", founding: false, lastContact: "2026-09-10", notes: "Booth annual — waiting on bank confirm." },
  { id: "WDTG-833201", name: "May Ornanong", plan: "WDT 399", status: "Active", joinedAt: "2026-09-15", nextRenewal: "2026-10-15", cycle: "Monthly", method: "PromptPay", payStatus: "Pending", payDate: "2026-09-15", autoRenew: true, channel: "mobile", founding: false, lastContact: "2026-09-15", notes: "Newest booth signup." },
  { id: "WDTG-260448", name: "Chai Rungsan", plan: "WDT 999", status: "Active", joinedAt: "2026-07-27", nextRenewal: "2026-10-27", cycle: "Monthly", method: "Card", payStatus: "Success", payDate: "2026-09-27", autoRenew: true, channel: "desktop", founding: false, lastContact: "2026-09-09", notes: "" },
];

function chargeAmount(plan: PlanName, cycle: BillingCycle) {
  const monthly = PLAN_MONTHLY[plan];
  return cycle === "Annual" ? annualPrice(monthly) : monthly;
}

function emailFromName(name: string) {
  const local = name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
  return `${local}@example.com`;
}

function daysBetween(fromIso: string, toIso: string) {
  const from = Date.parse(`${fromIso}T00:00:00`);
  const to = Date.parse(`${toIso}T00:00:00`);
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

export function retryStageFromDays(days: number): RetryStage {
  if (days >= 7) return 7;
  if (days >= 3) return 3;
  return 1;
}

export const MEMBERS = SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  email: emailFromName(seed.name),
  plan: seed.plan,
  status: seed.status,
  joinedAt: seed.joinedAt,
  nextRenewal: seed.nextRenewal,
  channel: seed.channel,
  founding: seed.founding,
  lastContact: seed.lastContact,
  notes: seed.notes,
}));

export const PAYMENTS = SEEDS.map((seed, i) => ({
  id: `pay-${String(i + 1).padStart(2, "0")}`,
  date: seed.payDate,
  guardianId: seed.id,
  amount: chargeAmount(seed.plan, seed.cycle),
  method: seed.method,
  status: seed.payStatus,
}));

export const SUBSCRIPTIONS = SEEDS.map((seed, i) => ({
  id: `sub-${String(i + 1).padStart(2, "0")}`,
  guardianId: seed.id,
  plan: seed.plan,
  cycle: seed.cycle,
  status: seed.status,
  nextCharge: seed.nextRenewal,
  autoRenew: seed.autoRenew,
  amount: chargeAmount(seed.plan, seed.cycle),
}));

export const FAILED_PAYMENTS = SEEDS.filter((seed) => seed.payStatus === "Failed").map((seed, i) => {
  const daysSinceFailure = daysBetween(seed.payDate, AS_OF);
  return {
    id: `fail-${String(i + 1).padStart(2, "0")}`,
    guardianId: seed.id,
    amount: chargeAmount(seed.plan, seed.cycle),
    reason: seed.failReason ?? "Card declined",
    failedOn: seed.payDate,
    daysSinceFailure,
    retryStage: retryStageFromDays(daysSinceFailure),
  };
});

export const CRM_CONTACTS = MEMBERS.map((member) => ({
  id: member.id,
  name: member.name,
  email: member.email,
  lastContact: member.lastContact,
  notes: member.notes,
}));

export const FOUNDING_MEMBERS = [...MEMBERS]
  .filter((member) => member.founding)
  .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

export const BOOTH_QUEUE = MEMBERS.map((member, i) => ({
  guardianId: member.id,
  plan: member.plan,
  device: BOOTH_DEVICES[i % 2],
}));

export type MockMember = (typeof MEMBERS)[number];
export type MockPayment = (typeof PAYMENTS)[number];
export type MockSubscription = (typeof SUBSCRIPTIONS)[number];
export type FailedPayment = (typeof FAILED_PAYMENTS)[number];
export type CrmContact = (typeof CRM_CONTACTS)[number];
export type BoothSignupSeed = (typeof BOOTH_QUEUE)[number];

export const failedPaymentCount = FAILED_PAYMENTS.length;
export const pendingPaymentCount = PAYMENTS.filter((p) => p.status === "Pending").length;

export const recentMembers = [...MEMBERS]
  .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
  .slice(0, 8);

const activeMembers = MEMBERS.filter((m) => m.status === "Active");
const newSince = new Date("2026-08-20T00:00:00");
const newMembers = MEMBERS.filter((m) => new Date(`${m.joinedAt}T00:00:00`) >= newSince);
const newMobileShare = newMembers.length
  ? Math.round((newMembers.filter((m) => m.channel === "mobile").length / newMembers.length) * 100)
  : 0;

const mrr = SUBSCRIPTIONS.filter((s) => s.status === "Active").reduce((sum, sub) => {
  return sum + PLAN_MONTHLY[sub.plan];
}, 0);

export const DASHBOARD_STATS = [
  {
    label: "Active Members",
    value: activeMembers.length.toLocaleString("en-US"),
    trend: `${MEMBERS.length} in this book`,
    tone: "up" as const,
  },
  {
    label: "MRR",
    value: formatMoney(mrr).replace("฿", "THB "),
    trend: `${activeMembers.length} active plans`,
    tone: "up" as const,
  },
  {
    label: "New — 30 days",
    value: String(newMembers.length),
    trend: `${newMobileShare}% mobile`,
    tone: "muted" as const,
  },
  {
    label: "Needs action",
    value: String(failedPaymentCount + pendingPaymentCount),
    trend: `${failedPaymentCount} failed + ${pendingPaymentCount} pending`,
    tone: "muted" as const,
  },
];

export function displayDate(iso: string | null) {
  if (!iso) return "—";
  return formatDate(`${iso}T00:00:00`);
}

export function displayAmount(amount: number) {
  return formatMoney(amount);
}

export function displayTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function displayDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function inDateRange(iso: string, from: string, to: string) {
  const day = iso.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export type AuditActor = "System" | "Admin · Desk" | "Admin · Content" | "Admin · Booth";

export type AuditEvent = {
  id: string;
  at: string;
  actor: AuditActor;
  action: string;
};

const AUDIT_SEEDS: AuditEvent[] = [
  { id: "aud-22", at: "2026-09-19T16:42:00+07:00", actor: "Admin · Content", action: "Updated content: Hero headline" },
  { id: "aud-21", at: "2026-09-19T15:18:00+07:00", actor: "System", action: "Payment confirmed: WDTG-914870" },
  { id: "aud-20", at: "2026-09-19T14:05:00+07:00", actor: "Admin · Desk", action: "Member status changed: WDTG-330188 → Past Due" },
  { id: "aud-19", at: "2026-09-19T11:27:00+07:00", actor: "Admin · Booth", action: "Booth signup queued: WDTG-833201 on Booth iPad #2" },
  { id: "aud-18", at: "2026-09-18T17:51:00+07:00", actor: "System", action: "Retry scheduled (Day 1): WDTG-628441" },
  { id: "aud-17", at: "2026-09-18T17:44:00+07:00", actor: "System", action: "Payment failed: WDTG-628441 — Insufficient funds" },
  { id: "aud-16", at: "2026-09-18T09:12:00+07:00", actor: "Admin · Desk", action: "CRM note updated: WDTG-441902" },
  { id: "aud-15", at: "2026-09-17T16:08:00+07:00", actor: "System", action: "Payment confirmed: WDTG-441902" },
  { id: "aud-14", at: "2026-09-16T19:33:00+07:00", actor: "System", action: "Retry scheduled (Day 3): WDTG-447190" },
  { id: "aud-13", at: "2026-09-16T19:20:00+07:00", actor: "System", action: "Payment failed: WDTG-447190 — Card declined" },
  { id: "aud-12", at: "2026-09-16T10:04:00+07:00", actor: "Admin · Desk", action: "Member status changed: WDTG-447190 → Past Due" },
  { id: "aud-11", at: "2026-09-15T18:46:00+07:00", actor: "Admin · Booth", action: "Booth signup queued: WDTG-833201 on Booth iPad #1" },
  { id: "aud-10", at: "2026-09-15T13:22:00+07:00", actor: "Admin · Content", action: "Updated content: Pricing display" },
  { id: "aud-09", at: "2026-09-14T08:55:00+07:00", actor: "System", action: "Payment confirmed: WDTG-118204" },
  { id: "aud-08", at: "2026-09-12T21:17:00+07:00", actor: "Admin · Desk", action: "Member status changed: WDTG-257140 → Past Due" },
  { id: "aud-07", at: "2026-09-12T09:41:00+07:00", actor: "System", action: "Payment confirmed: WDTG-774210" },
  { id: "aud-06", at: "2026-09-10T16:29:00+07:00", actor: "Admin · Booth", action: "Booth annual queued: WDTG-477610 — waiting on bank confirm" },
  { id: "aud-05", at: "2026-09-08T11:03:00+07:00", actor: "System", action: "Payment confirmed: WDTG-902411" },
  { id: "aud-04", at: "2026-09-05T15:36:00+07:00", actor: "Admin · Content", action: "Updated content: FAQ item 2" },
  { id: "aud-03", at: "2026-09-03T12:14:00+07:00", actor: "System", action: "Payment confirmed: WDTG-192773" },
  { id: "aud-02", at: "2026-08-20T18:02:00+07:00", actor: "Admin · Desk", action: "Member status changed: WDTG-109633 → Cancelled" },
  { id: "aud-01", at: "2026-08-12T10:47:00+07:00", actor: "Admin · Desk", action: "Retries stopped: WDTG-220184" },
];

export const AUDIT_EVENTS = [...AUDIT_SEEDS].sort((a, b) => b.at.localeCompare(a.at));
