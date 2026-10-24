import { NextResponse } from "next/server";
import {
  adminCookieHeader,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin auth not configured (ADMIN_PASSWORD / ADMIN_ALLOWLIST)" },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  const token = createAdminSessionToken(email);
  const res = NextResponse.json({ ok: true, email: email.toLowerCase() });
  res.headers.set("Set-Cookie", adminCookieHeader(token));
  return res;
}
