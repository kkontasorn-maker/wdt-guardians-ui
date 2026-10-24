import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  isAdminConfigured,
  readAdminSession,
} from "@/lib/admin-auth";
import { getAdminBookWithLivePayments } from "@/lib/admin-book";

export const runtime = "nodejs";

export async function GET() {
  if (isAdminConfigured()) {
    const token = cookies().get(ADMIN_COOKIE)?.value;
    if (!readAdminSession(token)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const book = await getAdminBookWithLivePayments();
  return NextResponse.json(book);
}
