import { newGuardianId, newId, nowIso } from "./ids";
import { isSpinePlanId, planAmountThb } from "./plans";
import { getStore } from "./store";
import { transition } from "./states";
import type {
  JoinPendingInput,
  MemberWithSubscription,
  PaymentAttemptRecord,
  SubscriptionRecord,
} from "./types";

export type JoinPendingResult = {
  member: MemberWithSubscription["member"];
  subscription: SubscriptionRecord;
  paymentAttempt: PaymentAttemptRecord;
};

export async function createPendingMembership(
  input: JoinPendingInput
): Promise<JoinPendingResult> {
  if (!isSpinePlanId(input.planId)) {
    throw new Error(`invalid planId: ${input.planId}`);
  }
  if (input.interval !== "monthly" && input.interval !== "annual") {
    throw new Error(`invalid interval: ${input.interval}`);
  }

  const store = await getStore();
  const ts = nowIso();
  const amountThb = planAmountThb(input.planId, input.interval);

  const member = await store.createMember({
    id: newId("mem"),
    guardianId: newGuardianId(),
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone?.trim() || null,
    locale: input.locale ?? "en",
    founding: Boolean(input.founding),
    createdAt: ts,
    updatedAt: ts,
  });

  const subscription = await store.createSubscription({
    id: newId("sub"),
    memberId: member.id,
    planId: input.planId,
    interval: input.interval,
    status: "pending",
    amountThb,
    currency: "THB",
    activatedAt: null,
    cancelledAt: null,
    currentPeriodEnd: null,
    createdAt: ts,
    updatedAt: ts,
  });

  const paymentAttempt = await store.createPaymentAttempt({
    id: newId("pay"),
    subscriptionId: subscription.id,
    memberId: member.id,
    amountThb,
    currency: "THB",
    status: "pending",
    paymentMethod: null,
    gatewayChargeId: null,
    gatewayEventId: null,
    failureCode: null,
    createdAt: ts,
    updatedAt: ts,
  });

  await store.appendAudit({
    id: newId("aud"),
    actor: "system",
    action: "membership.pending_created",
    entityType: "subscription",
    entityId: subscription.id,
    payloadJson: JSON.stringify({
      guardianId: member.guardianId,
      planId: input.planId,
      interval: input.interval,
      amountThb,
    }),
    createdAt: ts,
  });

  return { member, subscription, paymentAttempt };
}

export async function getMemberByGuardianId(
  guardianId: string
): Promise<MemberWithSubscription | null> {
  const store = await getStore();
  return store.getMemberByGuardianId(guardianId);
}

export type OmiseWebhookResult =
  | { status: "ignored"; reason: string }
  | { status: "duplicate"; gatewayEventId: string }
  | { status: "activated"; guardianId: string; subscriptionId: string }
  | { status: "recorded"; reason: string };

/**
 * Process a successful charge event. Idempotent by gateway event id.
 * Activates subscription only via state machine with paymentConfirmed=true.
 */
export async function handleOmiseChargeComplete(params: {
  gatewayEventId: string;
  gatewayChargeId: string;
  subscriptionId?: string;
}): Promise<OmiseWebhookResult> {
  const store = await getStore();
  const existing = await store.getPaymentAttemptByGatewayEventId(params.gatewayEventId);
  if (existing) {
    return { status: "duplicate", gatewayEventId: params.gatewayEventId };
  }

  const attempt = params.gatewayChargeId
    ? await store.findPendingAttemptByChargeId(params.gatewayChargeId)
    : null;

  let subscription: SubscriptionRecord | null = null;
  if (params.subscriptionId) {
    subscription = await store.getSubscription(params.subscriptionId);
  } else if (attempt) {
    subscription = await store.getSubscription(attempt.subscriptionId);
  }

  if (!subscription) {
    const ts = nowIso();
    await store.appendAudit({
      id: newId("aud"),
      actor: "omise.webhook",
      action: "payment.orphan_charge",
      entityType: "gateway_event",
      entityId: params.gatewayEventId,
      payloadJson: JSON.stringify(params),
      createdAt: ts,
    });
    return { status: "recorded", reason: "no matching subscription" };
  }

  const ts = nowIso();
  const result = transition(subscription.status, "payment_confirmed", {
    paymentConfirmed: true,
  });

  if (!result.ok) {
    await store.createPaymentAttempt({
      id: newId("pay"),
      subscriptionId: subscription.id,
      memberId: subscription.memberId,
      amountThb: subscription.amountThb,
      currency: "THB",
      status: "ignored",
      paymentMethod: attempt?.paymentMethod ?? null,
      gatewayChargeId: params.gatewayChargeId,
      gatewayEventId: params.gatewayEventId,
      failureCode: result.reason,
      createdAt: ts,
      updatedAt: ts,
    });
    return { status: "ignored", reason: result.reason };
  }

  await store.updateSubscription({
    ...subscription,
    status: result.to,
    activatedAt: subscription.activatedAt ?? ts,
    updatedAt: ts,
  });

  if (attempt) {
    await store.updatePaymentAttempt({
      ...attempt,
      status: "successful",
      gatewayChargeId: params.gatewayChargeId,
      gatewayEventId: params.gatewayEventId,
      updatedAt: ts,
    });
  } else {
    await store.createPaymentAttempt({
      id: newId("pay"),
      subscriptionId: subscription.id,
      memberId: subscription.memberId,
      amountThb: subscription.amountThb,
      currency: "THB",
      status: "successful",
      paymentMethod: null,
      gatewayChargeId: params.gatewayChargeId,
      gatewayEventId: params.gatewayEventId,
      failureCode: null,
      createdAt: ts,
      updatedAt: ts,
    });
  }

  const member = await store.getMemberById(subscription.memberId);
  await store.appendAudit({
    id: newId("aud"),
    actor: "omise.webhook",
    action: "membership.activated",
    entityType: "subscription",
    entityId: subscription.id,
    payloadJson: JSON.stringify({
      gatewayEventId: params.gatewayEventId,
      gatewayChargeId: params.gatewayChargeId,
      from: result.from,
      to: result.to,
    }),
    createdAt: ts,
  });

  return {
    status: "activated",
    guardianId: member?.guardianId ?? "unknown",
    subscriptionId: subscription.id,
  };
}
