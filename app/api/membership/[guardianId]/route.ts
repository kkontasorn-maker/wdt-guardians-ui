import { NextResponse } from "next/server";
import { getMemberByGuardianId } from "@/lib/spine";

export const runtime = "nodejs";

/**
 * GET /api/membership/:guardianId
 */
export async function GET(
  _request: Request,
  context: { params: { guardianId: string } }
) {
  const guardianId = context.params.guardianId?.trim();
  if (!guardianId) {
    return NextResponse.json({ error: "guardianId required" }, { status: 400 });
  }

  const row = await getMemberByGuardianId(guardianId);
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    guardianId: row.member.guardianId,
    email: row.member.email,
    firstName: row.member.firstName,
    lastName: row.member.lastName,
    locale: row.member.locale,
    founding: row.member.founding,
    subscription: row.subscription
      ? {
          id: row.subscription.id,
          planId: row.subscription.planId,
          interval: row.subscription.interval,
          status: row.subscription.status,
          amountThb: row.subscription.amountThb,
          currency: row.subscription.currency,
          activatedAt: row.subscription.activatedAt,
          cancelledAt: row.subscription.cancelledAt,
          currentPeriodEnd: row.subscription.currentPeriodEnd,
        }
      : null,
  });
}
