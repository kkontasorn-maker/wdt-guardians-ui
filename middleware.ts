import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "wdt_admin_session";

/**
 * Edge-safe gate: requires admin cookie presence for /admin (except login).
 * Full HMAC + allowlist check runs in Node route handlers / layout.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  // If admin auth not configured, allow (local prototype). Configured → require cookie.
  const configured = Boolean(
    process.env.ADMIN_PASSWORD && process.env.ADMIN_ALLOWLIST
  );
  if (!configured) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
