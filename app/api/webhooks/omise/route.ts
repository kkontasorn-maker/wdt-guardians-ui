import { NextResponse } from "next/server";
import { upsertLiveMember, upsertLivePayment } from "@/lib/admin-book";
import { sendWelcomeGuardianEmail } from "@/lib/mail";
import { nowIso } from "@/lib/spine/ids";
import { PLANS, type SpinePlanId } from "@/lib/spine/plans";
import {
  getOmiseConfig,
  handleOmiseChargeComplete,
  isSuccessfulChargeEvent,
  verifyOmiseWebhookSignature,
} from "@/lib/spine";
import { getStore } from "@/lib/spine/store";

export const runtime = "nodejs";

type OmiseEventBody = {
  id?: string;
  key?: string;
  data?: {
    id?: string;
    object?: string;
    status?: string;
    metadata?: Record<string, string | undefined>;
  };
};

/**
 * POST /api/webhooks/omise
 * Skeleton: signature placeholder, idempotent by event id, activate on successful charge.
 * Missing Omise keys → still accepts events for local/dev (no live charge calls).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-omise-signature") ??
    request.headers.get("omise-signature");

  const verified = verifyOmiseWebhookSignature({
    rawBody,
    signatureHeader: signature,
    webhookSecretHeader: request.headers.get("x-webhook-secret"),
  });
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.reason ?? "invalid signature" },
      { status: 401 }
    );
  }

  const config = getOmiseConfig();
  if (!config.configured) {
    // Safe no-op path for build/dev without secrets — still process structure locally.
  }

  let body: OmiseEventBody;
  try {
    body = JSON.parse(rawBody) as OmiseEventBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const gatewayEventId = body.id;
  if (!gatewayEventId) {
    return NextResponse.json({ error: "missing event id" }, { status: 400 });
  }

  if (!isSuccessfulChargeEvent(body.key)) {
    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: `event key not actionable: ${body.key ?? "(none)"}`,
      signatureSkipped: verified.skipped,
      omiseConfigured: config.configured,
    });
  }

  const charge = body.data;
  const chargeOk =
    charge?.object === "charge" &&
    (charge.status === "successful" || charge.status === "paid" || !charge.status);

  if (charge && charge.status && !chargeOk) {
    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: `charge status not successful: ${charge.status}`,
    });
  }

  const gatewayChargeId = charge?.id ?? `unknown_${gatewayEventId}`;
  const subscriptionId =
    charge?.metadata?.subscription_id ?? charge?.metadata?.subscriptionId;

  const result = await handleOmiseChargeComplete({
    gatewayEventId,
    gatewayChargeId,
    subscriptionId,
  });

  if (result.status === "activated") {
    const store = await getStore();
    const row = await store.getMemberByGuardianId(result.guardianId);
    if (row?.member && row.subscription) {
      const ts = nowIso();
      upsertLiveMember({
        id: row.member.guardianId,
        name: `${row.member.firstName} ${row.member.lastName}`,
        email: row.member.email,
        plan: PLANS[row.subscription.planId as SpinePlanId].name as
          | "WDT 199"
          | "WDT 399"
          | "WDT 999",
        status: "Active",
        joinedAt: ts,
        nextRenewal: null,
        founding: row.member.founding,
        channel: "mobile",
      });
      const attempt =
        (await store.getPaymentAttemptByGatewayEventId(gatewayEventId)) ??
        (await store.listPaymentAttempts()).find(
          (a) => a.gatewayChargeId === gatewayChargeId
        );
      if (attempt) {
        upsertLivePayment({
          id: attempt.id,
          guardianId: row.member.guardianId,
          amount: row.subscription.amountThb,
          method:
            attempt.paymentMethod === "promptpay" ? "PromptPay" : "Card",
          status: "Success",
          date: ts,
        });
      }
      void sendWelcomeGuardianEmail({
        to: row.member.email,
        firstName: row.member.firstName,
        guardianId: row.member.guardianId,
        planLabel: PLANS[row.subscription.planId as SpinePlanId].name,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    result,
    signatureSkipped: verified.skipped,
    omiseConfigured: config.configured,
  });
}
