import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  isAdminConfigured,
  readAdminSession,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  if (!isAdminConfigured()) {
    return NextResponse.json({ configured: false, email: null });
  }
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const session = readAdminSession(token);
  return NextResponse.json({
    configured: true,
    email: session?.email ?? null,
  });
}
