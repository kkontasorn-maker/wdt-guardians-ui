import { NextResponse } from "next/server";
import {
  createPendingMembership,
  isSpinePlanId,
  type BillingInterval,
  type LocaleCode,
} from "@/lib/spine";

export const runtime = "nodejs";

type JoinBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  planId?: string;
  interval?: string;
  locale?: string;
  founding?: boolean;
};

/**
 * POST /api/membership/join
 * Creates a pending membership intent. Does not activate — wait for Omise webhook.
 */
export async function POST(request: Request) {
  let body: JoinBody;
  try {
    body = (await request.json()) as JoinBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim();
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const planId = body.planId?.trim();
  const interval = body.interval?.trim() as BillingInterval | undefined;

  if (!email || !firstName || !lastName || !planId || !interval) {
    return NextResponse.json(
      { error: "email, firstName, lastName, planId, and interval are required" },
      { status: 400 }
    );
  }
  if (!isSpinePlanId(planId)) {
    return NextResponse.json({ error: "invalid planId" }, { status: 400 });
  }
  if (interval !== "monthly" && interval !== "annual") {
    return NextResponse.json({ error: "invalid interval" }, { status: 400 });
  }

  const locale: LocaleCode =
    body.locale === "th" || body.locale === "en" ? body.locale : "en";

  try {
    const result = await createPendingMembership({
      email,
      firstName,
      lastName,
      phone: body.phone,
      planId,
      interval,
      locale,
      founding: body.founding,
    });

    return NextResponse.json(
      {
        guardianId: result.member.guardianId,
        memberId: result.member.id,
        subscriptionId: result.subscription.id,
        paymentAttemptId: result.paymentAttempt.id,
        status: result.subscription.status,
        amountThb: result.subscription.amountThb,
        currency: "THB",
        message:
          "Membership pending. Activate only after Omise charge confirmation webhook.",
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "join failed" },
      { status: 500 }
    );
  }
}
