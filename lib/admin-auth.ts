import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "wdt_admin_session";
const MAX_AGE_SEC = 60 * 60 * 12; // 12h

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

export function verifyAdminCredentials(email: string, password: string): boolean {
  const allow = getAdminAllowlist();
  const expectedPass = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (!expectedPass || allow.length === 0) return false;

  const normalized = email.trim().toLowerCase();
  if (!allow.includes(normalized)) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expectedPass);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const body = `${email.trim().toLowerCase()}|${exp}`;
  return `${body}|${sign(body)}`;
}

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
  if (!getAdminAllowlist().includes(email.toLowerCase())) return null;
  return { email: email.toLowerCase() };
}

export function adminCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearAdminCookieHeader(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
