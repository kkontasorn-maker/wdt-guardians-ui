/**
 * Subscription lifecycle state machine (pure).
 * Activate only after payment is confirmed (see transition options).
 */

export const SUBSCRIPTION_STATUSES = [
  "pending",
  "active",
  "past_due",
  "grace",
  "cancelled",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type TransitionEvent =
  | "payment_confirmed"
  | "payment_failed"
  | "enter_grace"
  | "payment_recovered"
  | "cancel"
  | "abandon";

export type TransitionResult =
  | { ok: true; from: SubscriptionStatus; to: SubscriptionStatus; event: TransitionEvent }
  | { ok: false; from: SubscriptionStatus; event: TransitionEvent; reason: string };

/** Allowed edges: from → event → to */
const EDGES: Record<
  SubscriptionStatus,
  Partial<Record<TransitionEvent, SubscriptionStatus>>
> = {
  pending: {
    payment_confirmed: "active",
    abandon: "cancelled",
    cancel: "cancelled",
  },
  active: {
    payment_failed: "past_due",
    cancel: "cancelled",
  },
  past_due: {
    enter_grace: "grace",
    payment_recovered: "active",
    payment_confirmed: "active",
    cancel: "cancelled",
  },
  grace: {
    payment_recovered: "active",
    payment_confirmed: "active",
    cancel: "cancelled",
  },
  cancelled: {},
};

export function canTransition(
  from: SubscriptionStatus,
  event: TransitionEvent
): boolean {
  return EDGES[from][event] !== undefined;
}

export function nextStatus(
  from: SubscriptionStatus,
  event: TransitionEvent
): SubscriptionStatus | null {
  return EDGES[from][event] ?? null;
}

/**
 * Apply a transition. `payment_confirmed` is the only path from pending → active.
 * Passing paymentConfirmed:false rejects activation even if the event name matches.
 */
export function transition(
  from: SubscriptionStatus,
  event: TransitionEvent,
  options?: { paymentConfirmed?: boolean }
): TransitionResult {
  if (event === "payment_confirmed" && options?.paymentConfirmed !== true) {
    return {
      ok: false,
      from,
      event,
      reason: "activation requires paymentConfirmed=true (gateway confirmation)",
    };
  }

  const to = nextStatus(from, event);
  if (!to) {
    return {
      ok: false,
      from,
      event,
      reason: `transition not allowed: ${from} + ${event}`,
    };
  }

  return { ok: true, from, to, event };
}

export function isTerminal(status: SubscriptionStatus): boolean {
  return status === "cancelled";
}
