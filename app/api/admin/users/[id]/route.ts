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
  deleteAdminUser,
  getAdminUserById,
  updateAdminUser,
  type AdminRole,
} from "@/lib/admin-users";
import { adminPasswordResetEmail, sendMail } from "@/lib/mail";

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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdminActor();
  if ("error" in gate && gate.error) return gate.error;

  let body: {
    name?: string;
    role?: AdminRole;
    active?: boolean;
    mustChangePassword?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (body.role && !ADMIN_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  const existing = await getAdminUserById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const forceChange =
    body.mustChangePassword === true && !existing.mustChangePassword;
  const tempPassword = forceChange ? generateTempPassword() : undefined;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:43127";

  try {
    const user = await updateAdminUser(params.id, {
      name: body.name,
      role: body.role,
      active: body.active,
      mustChangePassword: body.mustChangePassword,
      password: tempPassword,
    });

    let emailNotification: Awaited<ReturnType<typeof sendMail>> | null = null;
    if (forceChange && tempPassword) {
      emailNotification = await sendMail(
        adminPasswordResetEmail({
          to: user.email,
          name: user.name,
          tempPassword,
          appUrl,
        })
      );
    }

    return NextResponse.json({
      user,
      emailNotification,
      temporaryPassword:
        forceChange && emailNotification?.mode === "log" ? tempPassword : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdminActor();
  if ("error" in gate && gate.error) return gate.error;

  try {
    await deleteAdminUser(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "delete failed" },
      { status: 400 }
    );
  }
}
