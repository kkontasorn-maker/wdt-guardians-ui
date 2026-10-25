import { createHmac, timingSafeEqual } from "crypto";
import {
  authenticateAdminUser,
  getAdminUserByEmail,
  touchAdminLogin,
  type AdminRole,
  type AdminUserPublic,
} from "@/lib/admin-users";

export const ADMIN_COOKIE = "wdt_admin_session";
const MAX_AGE_SEC = 60 * 60 * 12; // 12h

export type AdminSession = {
  email: string;
  role: AdminRole;
  mustChangePassword: boolean;
  userId: string;
  name: string;
};

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "dev-only-soft-launch"
  );
}

export function getAdminAllowlist(): string[] {
  return (process.env.ADMIN_ALLOWLIST ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim()) && getAdminAllowlist().length > 0;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const body = `${email.trim().toLowerCase()}|${exp}`;
  return `${body}|${sign(body)}`;
}

/** Sync cookie parse only — use resolveAdminSession for full user check. */
export function readAdminSession(
  token: string | undefined | null
): { email: string } | null {
  if (!token) return null;
  const parts = token.split("|");
  if (parts.length !== 3) return null;
  const [email, expStr, sig] = parts;
  const body = `${email}|${expStr}`;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  return { email: email.toLowerCase() };
}

export async function resolveAdminSession(
  token: string | undefined | null
): Promise<AdminSession | null> {
  const basic = readAdminSession(token);
  if (!basic) return null;
  const user = await getAdminUserByEmail(basic.email);
  if (!user || !user.active) return null;
  return {
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    userId: user.id,
    name: user.name,
  };
}

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<AdminUserPublic | null> {
  const user = await authenticateAdminUser(email, password);
  if (!user) return null;
  await touchAdminLogin(user.email);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export function requireAdministrator(session: AdminSession | null): boolean {
  return Boolean(session && session.role === "administrator");
}

export function adminCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearAdminCookieHeader(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
