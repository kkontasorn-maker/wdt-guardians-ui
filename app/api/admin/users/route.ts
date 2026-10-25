import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  isAdminConfigured,
  requireAdministrator,
  resolveAdminSession,
} from "@/lib/admin-auth";
import { generateTempPassword } from "@/lib/admin-password";
import {
  ADMIN_ROLES,
  createAdminUser,
  listAdminUsers,
  type AdminRole,
} from "@/lib/admin-users";
import { adminInviteEmail, sendMail } from "@/lib/mail";

export const runtime = "nodejs";

async function requireAdminActor() {
  if (!isAdminConfigured()) {
    return { error: NextResponse.json({ error: "not configured" }, { status: 503 }) };
  }
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const session = await resolveAdminSession(token);
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (!requireAdministrator(session)) {
    return {
      error: NextResponse.json(
        { error: "Only administrators can manage admin users" },
        { status: 403 }
      ),
    };
  }
  return { session };
}

export async function GET() {
  const gate = await requireAdminActor();
  if ("error" in gate && gate.error) return gate.error;
  const users = await listAdminUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const gate = await requireAdminActor();
  if ("error" in gate && gate.error) return gate.error;

  let body: {
    email?: string;
    name?: string;
    role?: AdminRole;
    mustChangePassword?: boolean;
    active?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const role = body.role ?? "officer";
  if (!ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  const mustChangePassword = body.mustChangePassword !== false;
  const tempPassword = generateTempPassword();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:43127";

  try {
    const user = await createAdminUser({
      email: body.email ?? "",
      name: body.name,
      role,
      password: tempPassword,
      mustChangePassword,
      active: body.active !== false,
    });

    const mail = await sendMail(
      adminInviteEmail({
        to: user.email,
        name: user.name,
        tempPassword,
        mustChangePassword,
        appUrl,
      })
    );

    return NextResponse.json({
      user,
      emailNotification: mail,
      // Soft Launch: expose temp password when mail is log-only so admin can share securely
      temporaryPassword: mail.mode === "log" ? tempPassword : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "create failed" },
      { status: 400 }
    );
  }
}
