import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  isAdminConfigured,
  resolveAdminSession,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  if (!isAdminConfigured()) {
    return NextResponse.json({ configured: false, email: null });
  }
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const session = await resolveAdminSession(token);
  if (!session) {
    return NextResponse.json({ configured: true, email: null });
  }
  return NextResponse.json({
    configured: true,
    email: session.email,
    role: session.role,
    mustChangePassword: session.mustChangePassword,
    name: session.name,
    userId: session.userId,
  });
}
