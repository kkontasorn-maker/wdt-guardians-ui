import { NextResponse } from "next/server";
import { upsertLiveMember } from "@/lib/admin-book";
import { nowIso } from "@/lib/spine/ids";
import { PLANS, type SpinePlanId } from "@/lib/spine/plans";
import { createOmiseCharge, thbToSatang } from "@/lib/spine/omise-charge";
import { handleOmiseChargeComplete } from "@/lib/spine/service";
import { getStore } from "@/lib/spine/store";

export const runtime = "nodejs";

type Body = {
  omiseToken?: string;
  subscriptionId?: string;
  paymentAttemptId?: string;
};

/**
 * POST /api/membership/charge
 * Accepts Omise.js card token only — never raw PAN.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const token = body.omiseToken?.trim();
  const subscriptionId = body.subscriptionId?.trim();
  if (!token || !subscriptionId) {
    return NextResponse.json(
      { error: "omiseToken and subscriptionId required" },
      { status: 400 }
    );
  }

  const store = await getStore();
  const subscription = await store.getSubscription(subscriptionId);
  if (!subscription) {
    return NextResponse.json({ error: "subscription not found" }, { status: 404 });
  }
  if (subscription.status !== "pending") {
    return NextResponse.json(
      { error: `subscription not pending (${subscription.status})` },
      { status: 409 }
    );
  }

  const member = await store.getMemberById(subscription.memberId);
  if (!member) {
    return NextResponse.json({ error: "member not found" }, { status: 404 });
  }

  const charge = await createOmiseCharge({
    token,
    amountSatang: thbToSatang(subscription.amountThb),
    description: `WDT Guardians ${subscription.planId} ${subscription.interval}`,
    metadata: {
      subscription_id: subscription.id,
      guardian_id: member.guardianId,
      payment_attempt_id: body.paymentAttemptId ?? "",
    },
  });

  if (!charge.ok) {
    return NextResponse.json(
      { error: charge.error, skipped: charge.skipped ?? false },
      { status: charge.skipped ? 503 : 402 }
    );
  }

  const ts = nowIso();
  const attempt =
    (body.paymentAttemptId
      ? await store.getPaymentAttempt(body.paymentAttemptId)
      : null) ?? (await store.findPendingAttemptBySubscription(subscription.id));

  if (attempt) {
    await store.updatePaymentAttempt({
      ...attempt,
      gatewayChargeId: charge.chargeId,
      status: charge.paid ? "successful" : "pending",
      updatedAt: ts,
    });
  }

  if (charge.paid) {
    const activated = await handleOmiseChargeComplete({
      gatewayEventId: `local_${charge.chargeId}`,
      gatewayChargeId: charge.chargeId,
      subscriptionId: subscription.id,
    });

    upsertLiveMember({
      id: member.guardianId,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      plan: planDisplay(subscription.planId),
      status: "Active",
      joinedAt: ts,
      nextRenewal: null,
      founding: member.founding,
    });

    return NextResponse.json({
      ok: true,
      chargeId: charge.chargeId,
      status: charge.status,
      paid: true,
      activation: activated,
      guardianId: member.guardianId,
    });
  }

  return NextResponse.json({
    ok: true,
    chargeId: charge.chargeId,
    status: charge.status,
    paid: false,
    message: "Charge created; waiting for webhook confirmation before activation.",
    guardianId: member.guardianId,
  });
}

function planDisplay(planId: SpinePlanId): "WDT 199" | "WDT 399" | "WDT 999" {
  return PLANS[planId].name as "WDT 199" | "WDT 399" | "WDT 999";
}
