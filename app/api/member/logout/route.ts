import { NextResponse } from "next/server";
import { clearMemberCookieHeader } from "@/lib/member-auth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearMemberCookieHeader());
  return res;
}
