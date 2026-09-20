export const STORAGE_KEY = "wdt-guardians-membership";

export type PlanId = "wdt199" | "wdt399" | "wdt999" | "custom";
export type NamedPlanId = Exclude<PlanId, "custom">;
export type BillingInterval = "monthly" | "annual";
export type MembershipStatus = "active" | "paused" | "canceled";
export type PaymentMethod = "card" | "bank" | "promptpay";

export type Plan = {
  id: NamedPlanId;
  name: string;
  monthly: number;
  blurb: string;
  perks: string[];
  popular?: boolean;
};

export type Receipt = {
  id: string;
  date: string;
  amount: number;
  interval: BillingInterval;
  status: "paid" | "refunded";
};

export type Membership = {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zip: string;
  planId: PlanId;
  amount: number;
  interval: BillingInterval;
  status: MembershipStatus;
  joinedAt: string;
  nextBillingAt: string | null;
  pausedAt: string | null;
  canceledAt: string | null;
  lastFour: string;
  cardBrand: string;
  paymentMethod: PaymentMethod;
  dedication: string;
  receipts: Receipt[];
};

export const PLANS: Plan[] = [
  {
    id: "wdt199",
    name: "WDT 199",
    monthly: 199,
    blurb: "Keeps the intake line and case log moving when a report first comes in.",
    perks: [
      "Helps staff case intake and verification",
      "Monthly Guardian note from the Chiang Mai desk",
      "Annual giving statement",
      "Pause or cancel any time",
    ],
  },
  {
    id: "wdt399",
    name: "WDT 399",
    monthly: 399,
    blurb: "The working gift: verification, coordination, and a field response that does not wait on a fundraiser.",
    perks: [
      "Everything in WDT 199",
      "Helps fund field response and on-site coordination",
      "Evidence follow-up support",
      "Priority invitation to member briefings",
    ],
    popular: true,
  },
  {
    id: "wdt999",
    name: "WDT 999",
    monthly: 999,
    blurb: "Underwrites urgent response and the slower work of documenting what happened.",
    perks: [
      "Everything in WDT 399",
      "Helps cover urgent field deployments",
      "Supports evidence packaging and follow-up",
      "Quarterly briefing with the program desk",
    ],
  },
];

export const PAYMENT_METHODS: {
  id: PaymentMethod;
  name: string;
  description: string;
}[] = [
  {
    id: "card",
    name: "Credit/debit card",
    description: "Visa, Mastercard, and other major cards issued in Thailand or abroad.",
  },
  {
    id: "bank",
    name: "Automatic bank debit",
    description: "A recurring debit from a Thai bank account on your renewal date.",
  },
  {
    id: "promptpay",
    name: "PromptPay",
    description: "Pay from any PromptPay-linked bank app when each renewal is due.",
  },
];

export const CUSTOM_MIN_MONTHLY = 99;
export const CUSTOM_MIN_ANNUAL = 990;

export function annualPrice(monthly: number) {
  return monthly * 10;
}

export function planById(id: PlanId) {
  if (id === "custom") {
    return {
      id: "custom" as const,
      name: "Your amount",
      monthly: 0,
      blurb: "Give what the month allows. Every Guardian funds the same operating capacity.",
      perks: [
        "Monthly Guardian note",
        "Annual giving statement",
        "Cancel or pause any time",
      ],
    };
  }
  return PLANS.find((plan) => plan.id === id) ?? PLANS[1];
}

export function displayPlanName(membership: Pick<Membership, "planId" | "amount">) {
  if (membership.planId === "custom") {
    return `Custom · ${formatMoney(membership.amount)}`;
  }
  return planById(membership.planId).name;
}

export function periodAmount(amount: number, interval: BillingInterval) {
  return interval === "annual" ? annualPrice(amount) : amount;
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function addInterval(iso: string, interval: BillingInterval) {
  const date = new Date(iso);
  if (interval === "annual") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
}

export function generateMemberId() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `WDTG-${n}`;
}

export function generateReceiptId() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `RCPT-${n}`;
}

export function impactFromMembership(membership: Membership) {
  const start = new Date(membership.joinedAt).getTime();
  const now = Date.now();
  const months = Math.max(1, Math.round((now - start) / (1000 * 60 * 60 * 24 * 30)));
  const annualized = membership.interval === "annual" ? membership.amount * 10 : membership.amount * 12;
  const given =
    membership.interval === "annual"
      ? membership.amount * 10 * Math.max(1, Math.round(months / 12))
      : membership.amount * months;

  return {
    months,
    given,
    cases: Math.max(1, Math.round(given / 90)),
    responses: Math.max(1, Math.round(given / 140)),
    followUps: Math.max(1, Math.round(given / 220)),
    annualized,
  };
}

export function readMembership(): Membership | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Membership;
    if (!parsed?.memberId || !parsed?.email) return null;
    return {
      ...parsed,
      phone: parsed.phone ?? "",
      paymentMethod: parsed.paymentMethod ?? "card",
    };
  } catch {
    throw new Error("corrupt");
  }
}

export function writeMembership(membership: Membership) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(membership));
  window.dispatchEvent(new Event("wdt-membership-changed"));
}

export function clearMembership() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("wdt-membership-changed"));
}

export function sampleMembership(): Membership {
  const joinedAt = new Date();
  joinedAt.setMonth(joinedAt.getMonth() - 7);
  const receipts: Receipt[] = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const date = new Date(joinedAt);
    date.setMonth(date.getMonth() + i);
    return {
      id: `RCPT-4${82010 + i}`,
      date: date.toISOString(),
      amount: 399,
      interval: "monthly",
      status: "paid",
    };
  });

  return {
    memberId: "WDTG-482910",
    firstName: "Niran",
    lastName: "Srisawat",
    email: "niran.srisawat@example.org",
    phone: "0812345678",
    zip: "50300",
    planId: "wdt399",
    amount: 399,
    interval: "monthly",
    status: "active",
    joinedAt: joinedAt.toISOString(),
    nextBillingAt: addInterval(receipts[receipts.length - 1].date, "monthly"),
    pausedAt: null,
    canceledAt: null,
    lastFour: "4242",
    cardBrand: "Visa",
    paymentMethod: "card",
    dedication: "For the Chiang Mai street-dog desk",
    receipts,
  };
}
