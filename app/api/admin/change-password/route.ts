import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  isAdminConfigured,
  resolveAdminSession,
} from "@/lib/admin-auth";
import { changeAdminPassword } from "@/lib/admin-users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const session = await resolveAdminSession(token);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "currentPassword and newPassword required" },
      { status: 400 }
    );
  }

  try {
    const user = await changeAdminPassword(
      session.email,
      currentPassword,
      newPassword
    );
    return NextResponse.json({
      ok: true,
      email: user.email,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "change failed" },
      { status: 400 }
    );
  }
}
