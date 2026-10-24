import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MEMBER_COOKIE, readMemberSession } from "@/lib/member-auth";
import { findGuardianForLogin } from "@/lib/member-portal";

export const runtime = "nodejs";

export async function GET() {
  const token = cookies().get(MEMBER_COOKIE)?.value;
  const session = readMemberSession(token);
  if (!session) {
    return NextResponse.json({ email: null, membership: null }, { status: 401 });
  }

  const found = await findGuardianForLogin(session.guardianId, session.email);
  if (!found) {
    return NextResponse.json({ error: "session stale" }, { status: 401 });
  }

  return NextResponse.json({
    email: found.email,
    guardianId: found.guardianId,
    membership: found.membership,
  });
}
