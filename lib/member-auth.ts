import { createHmac, timingSafeEqual } from "crypto";

export const MEMBER_COOKIE = "wdt_member_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days Soft Launch

function sessionSecret(): string {
  return (
    process.env.MEMBER_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "dev-member-soft-launch"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createMemberSessionToken(guardianId: string, email: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const body = `${guardianId.trim().toUpperCase()}|${email.trim().toLowerCase()}|${exp}`;
  return `${body}|${sign(body)}`;
}

export function readMemberSession(
  token: string | undefined | null
): { guardianId: string; email: string } | null {
  if (!token) return null;
  const parts = token.split("|");
  if (parts.length !== 4) return null;
  const [guardianId, email, expStr, sig] = parts;
  const body = `${guardianId}|${email}|${expStr}`;
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
  return { guardianId, email };
}

export function memberCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${MEMBER_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearMemberCookieHeader(): string {
  return `${MEMBER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
