import { NextResponse } from "next/server";
import { nowIso } from "@/lib/spine/ids";
import { isMobileBankId, mobileBankById } from "@/lib/spine/mobile-banks";
import {
  createOmiseMobileBankingCharge,
  thbToSatang,
} from "@/lib/spine/omise-charge";
import { getStore } from "@/lib/spine/store";

export const runtime = "nodejs";

type Body = {
  subscriptionId?: string;
  paymentAttemptId?: string;
  bankId?: string;
  /** Absolute return URL after bank app authorization (includes query params). */
  returnUri?: string;
};

/**
 * POST /api/membership/mobile-banking
 * Creates Omise Mobile Banking charge; client redirects to authorizeUri (bank app).
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const subscriptionId = body.subscriptionId?.trim();
  const bankId = body.bankId?.trim();
  const returnUri = body.returnUri?.trim();
  if (!subscriptionId || !bankId || !returnUri) {
    return NextResponse.json(
      { error: "subscriptionId, bankId, and returnUri required" },
      { status: 400 }
    );
  }
  if (!isMobileBankId(bankId)) {
    return NextResponse.json({ error: "unsupported bankId" }, { status: 400 });
  }
  const bank = mobileBankById(bankId);
  if (!bank) {
    return NextResponse.json({ error: "unsupported bankId" }, { status: 400 });
  }

  try {
    const parsed = new URL(returnUri);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return NextResponse.json({ error: "invalid returnUri" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "invalid returnUri" }, { status: 400 });
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

  const charge = await createOmiseMobileBankingCharge({
    sourceType: bank.sourceType,
    amountSatang: thbToSatang(subscription.amountThb),
    returnUri,
    description: `WDT Guardians ${subscription.planId} ${subscription.interval}`,
    metadata: {
      subscription_id: subscription.id,
      guardian_id: member.guardianId,
      payment_attempt_id: body.paymentAttemptId ?? "",
      method: "mobile_banking",
      bank_id: bank.id,
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

  return NextResponse.json({
    ok: true,
    chargeId: charge.chargeId,
    status: charge.status,
    paid: charge.paid,
    authorizeUri: charge.authorizeUri,
    bankId: bank.id,
    bankName: bank.nameEn,
    guardianId: member.guardianId,
    subscriptionId: subscription.id,
    amountThb: subscription.amountThb,
    message: "Open your bank app via authorizeUri, then return to finish activation.",
  });
}
