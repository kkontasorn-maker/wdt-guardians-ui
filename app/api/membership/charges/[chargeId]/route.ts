import { NextResponse } from "next/server";
import { upsertLiveMember } from "@/lib/admin-book";
import { nowIso } from "@/lib/spine/ids";
import { PLANS, type SpinePlanId } from "@/lib/spine/plans";
import { getOmiseChargeStatus } from "@/lib/spine/omise-charge";
import { handleOmiseChargeComplete } from "@/lib/spine/service";
import { getStore } from "@/lib/spine/store";

export const runtime = "nodejs";

/**
 * GET /api/membership/charges/:chargeId
 * Poll Omise charge status. When paid, activate pending subscription (idempotent with webhook).
 */
export async function GET(
  _request: Request,
  context: { params: { chargeId: string } }
) {
  const chargeId = context.params.chargeId?.trim();
  if (!chargeId) {
    return NextResponse.json({ error: "chargeId required" }, { status: 400 });
  }

  const status = await getOmiseChargeStatus(chargeId);
  if (!status.ok) {
    return NextResponse.json(
      { error: status.error, skipped: status.skipped ?? false },
      { status: status.skipped ? 503 : 404 }
    );
  }

  if (!status.paid) {
    return NextResponse.json({
      chargeId: status.chargeId,
      status: status.status,
      paid: false,
      qrImageUrl: status.qrImageUrl,
      activated: false,
    });
  }

  const store = await getStore();
  const attempt = await store.findPendingAttemptByChargeId(chargeId);

  const activated = await handleOmiseChargeComplete({
    gatewayEventId: `poll_${chargeId}`,
    gatewayChargeId: chargeId,
    subscriptionId: attempt?.subscriptionId,
  });

  if (activated.status === "activated") {
    const member = await store.getMemberByGuardianId(activated.guardianId);
    if (member?.member && member.subscription) {
      upsertLiveMember({
        id: member.member.guardianId,
        name: `${member.member.firstName} ${member.member.lastName}`,
        email: member.member.email,
        plan: PLANS[member.subscription.planId as SpinePlanId].name as
          | "WDT 199"
          | "WDT 399"
          | "WDT 999",
        status: "Active",
        joinedAt: nowIso(),
        nextRenewal: null,
        founding: member.member.founding,
        channel: "mobile",
      });
    }
  }

  return NextResponse.json({
    chargeId: status.chargeId,
    status: status.status,
    paid: true,
    qrImageUrl: status.qrImageUrl,
    activated: activated.status === "activated" || activated.status === "duplicate",
    activation: activated,
  });
}
