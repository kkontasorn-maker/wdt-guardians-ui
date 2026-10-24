import { getAdminBook } from "@/lib/admin-book";
import { getMemberProfile } from "@/lib/member-profiles";
import type { Membership, PlanId } from "@/lib/membership";
import { addInterval } from "@/lib/membership";
import { getMemberByGuardianId } from "@/lib/spine/service";
import type { SubscriptionStatus } from "@/lib/spine/states";

function applyProfile(membership: Membership): Membership {
  const profile = getMemberProfile(membership.memberId);
  if (!profile) {
    return {
      ...membership,
      facebook: membership.facebook ?? "",
      instagram: membership.instagram ?? "",
      lineId: membership.lineId ?? "",
      whatsapp: membership.whatsapp ?? "",
    };
  }
  return {
    ...membership,
    firstName: profile.firstName?.trim() || membership.firstName,
    lastName: profile.lastName?.trim() || membership.lastName,
    email: profile.email?.trim().toLowerCase() || membership.email,
    phone: profile.phone ?? membership.phone,
    facebook: profile.facebook ?? membership.facebook ?? "",
    instagram: profile.instagram ?? membership.instagram ?? "",
    lineId: profile.lineId ?? membership.lineId ?? "",
    whatsapp: profile.whatsapp ?? membership.whatsapp ?? "",
  };
}

function planIdFromLabel(plan: string): PlanId {
  if (plan.includes("199")) return "wdt199";
  if (plan.includes("999")) return "wdt999";
  if (plan.includes("399")) return "wdt399";
  if (plan === "wdt199" || plan === "wdt399" || plan === "wdt999" || plan === "custom") {
    return plan;
  }
  return "wdt399";
}

function uiStatus(
  status: SubscriptionStatus | string
): Membership["status"] {
  if (status === "cancelled" || status === "Canceled" || status === "Cancelled") {
    return "canceled";
  }
  if (status === "past_due" || status === "grace" || status === "Past Due") {
    return "paused"; // Soft Launch: show as paused-ish; manage UI has no past_due
  }
  if (status === "pending") return "paused";
  return "active";
}

/** Resolve Guardian by ID + email (spine store, then admin book). */
export async function findGuardianForLogin(
  guardianId: string,
  email: string
): Promise<{ guardianId: string; email: string; membership: Membership } | null> {
  const id = guardianId.trim().toUpperCase();
  const mail = email.trim().toLowerCase();
  if (!id || !mail) return null;

  const spine = await getMemberByGuardianId(id);
  const profileHint = getMemberProfile(id);
  const spineEmailOk =
    spine &&
    (spine.member.email.toLowerCase() === mail ||
      profileHint?.email?.toLowerCase() === mail);
  if (spine && spineEmailOk) {
    const sub = spine.subscription;
    const joinedAt = spine.member.createdAt;
    const interval = sub?.interval ?? "monthly";
    const amount = sub?.amountThb ?? 399;
    const monthly =
      interval === "annual" ? Math.round(amount / 10) : amount;
    const membership: Membership = {
      memberId: spine.member.guardianId,
      firstName: spine.member.firstName,
      lastName: spine.member.lastName,
      email: spine.member.email,
      phone: spine.member.phone ?? "",
      zip: "",
      planId: (sub?.planId as PlanId) ?? "wdt399",
      amount: monthly,
      interval,
      status: sub ? uiStatus(sub.status) : "active",
      joinedAt,
      nextBillingAt: sub?.currentPeriodEnd ?? addInterval(joinedAt, interval),
      pausedAt: sub?.status === "past_due" || sub?.status === "grace" ? joinedAt : null,
      canceledAt: sub?.cancelledAt ?? null,
      lastFour: "",
      cardBrand: "Card",
      paymentMethod: "card",
      dedication: "",
      facebook: "",
      instagram: "",
      lineId: "",
      whatsapp: "",
      receipts:
        sub?.status === "active"
          ? [
              {
                id: `RCPT-${spine.member.guardianId.slice(-6)}`,
                date: sub.activatedAt ?? joinedAt,
                amount: sub.amountThb,
                interval,
                status: "paid",
              },
            ]
          : [],
    };
    const merged = applyProfile(membership);
    return {
      guardianId: id,
      email: merged.email.toLowerCase(),
      membership: merged,
    };
  }

  const book = getAdminBook();
  const row = book.members.find(
    (m) => m.id.toUpperCase() === id && m.email.toLowerCase() === mail
  );
  if (!row) return null;

  const nameParts = row.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? row.name;
  const lastName = nameParts.slice(1).join(" ") || "Guardian";
  const planId = planIdFromLabel(row.plan);
  const monthly =
    planId === "wdt199" ? 199 : planId === "wdt999" ? 999 : 399;
  const interval =
    book.subscriptions.find((s) => s.guardianId === row.id)?.cycle === "Annual"
      ? "annual"
      : "monthly";

  const membership: Membership = {
    memberId: row.id,
    firstName,
    lastName,
    email: row.email,
    phone: "",
    zip: "",
    planId,
    amount: monthly,
    interval,
    status: uiStatus(row.status),
    joinedAt: `${row.joinedAt}T00:00:00.000Z`,
    nextBillingAt: row.nextRenewal ? `${row.nextRenewal}T00:00:00.000Z` : null,
    pausedAt: row.status === "Past Due" ? `${row.joinedAt}T00:00:00.000Z` : null,
    canceledAt: row.status === "Cancelled" ? `${row.joinedAt}T00:00:00.000Z` : null,
    lastFour: "",
    cardBrand: "Card",
    paymentMethod: "card",
    dedication: "",
    facebook: "",
    instagram: "",
    lineId: "",
    whatsapp: "",
    receipts: [],
  };

  const merged = applyProfile(membership);
  return {
    guardianId: id,
    email: merged.email.toLowerCase(),
    membership: merged,
  };
}
