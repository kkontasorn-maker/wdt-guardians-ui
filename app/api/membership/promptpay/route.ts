import { NextResponse } from "next/server";
import { nowIso } from "@/lib/spine/ids";
import {
  createOmisePromptPayCharge,
  thbToSatang,
} from "@/lib/spine/omise-charge";
import { getStore } from "@/lib/spine/store";

export const runtime = "nodejs";

type Body = {
  subscriptionId?: string;
  paymentAttemptId?: string;
};

/**
 * POST /api/membership/promptpay
 * Creates a pending PromptPay QR charge. Membership stays pending until paid.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const subscriptionId = body.subscriptionId?.trim();
  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });
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

  const charge = await createOmisePromptPayCharge({
    amountSatang: thbToSatang(subscription.amountThb),
    description: `WDT Guardians ${subscription.planId} ${subscription.interval}`,
    metadata: {
      subscription_id: subscription.id,
      guardian_id: member.guardianId,
      payment_attempt_id: body.paymentAttemptId ?? "",
      method: "promptpay",
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
      paymentMethod: "promptpay",
      gatewayChargeId: charge.chargeId,
      status: "pending",
      updatedAt: ts,
    });
  }

  return NextResponse.json({
    ok: true,
    chargeId: charge.chargeId,
    status: charge.status,
    paid: charge.paid,
    qrImageUrl: charge.qrImageUrl,
    expiresAt: charge.expiresAt,
    guardianId: member.guardianId,
    subscriptionId: subscription.id,
    amountThb: subscription.amountThb,
    message: "Scan the PromptPay QR. Membership activates after Omise confirms payment.",
  });
}
