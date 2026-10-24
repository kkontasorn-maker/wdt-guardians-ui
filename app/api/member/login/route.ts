import { NextResponse } from "next/server";
import {
  createMemberSessionToken,
  memberCookieHeader,
} from "@/lib/member-auth";
import { findGuardianForLogin } from "@/lib/member-portal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { guardianId?: string; email?: string };
  try {
    body = (await request.json()) as { guardianId?: string; email?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const guardianId = body.guardianId?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  if (!guardianId || !email) {
    return NextResponse.json(
      { error: "guardianId and email are required" },
      { status: 400 }
    );
  }

  const found = await findGuardianForLogin(guardianId, email);
  if (!found) {
    return NextResponse.json(
      { error: "No Guardian matched that ID and email" },
      { status: 401 }
    );
  }

  const token = createMemberSessionToken(found.guardianId, found.email);
  const res = NextResponse.json({
    ok: true,
    guardianId: found.guardianId,
    membership: found.membership,
  });
  res.headers.set("Set-Cookie", memberCookieHeader(token));
  return res;
}
