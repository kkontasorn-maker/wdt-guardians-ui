import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { updateAdminMemberContact } from "@/lib/admin-book";
import {
  MEMBER_COOKIE,
  createMemberSessionToken,
  memberCookieHeader,
  readMemberSession,
} from "@/lib/member-auth";
import { upsertMemberProfile } from "@/lib/member-profiles";
import { findGuardianForLogin } from "@/lib/member-portal";
import { nowIso } from "@/lib/spine/ids";
import { getStore } from "@/lib/spine/store";

export const runtime = "nodejs";

type Body = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
  lineId?: string;
  whatsapp?: string;
  photoDataUrl?: string;
};

const MAX_PHOTO_CHARS = 400_000;

/**
 * PATCH /api/member/profile
 * Session-gated Soft Launch profile update (contact + social handles).
 */
export async function PATCH(request: Request) {
  const token = cookies().get(MEMBER_COOKIE)?.value;
  const session = readMemberSession(token);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone?.trim() ?? "";
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "firstName and lastName required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }

  const facebook = (body.facebook ?? "").trim();
  const instagram = (body.instagram ?? "").trim();
  const lineId = (body.lineId ?? "").trim();
  const whatsapp = (body.whatsapp ?? "").trim();
  const photoRaw = body.photoDataUrl ?? "";
  const photoDataUrl =
    typeof photoRaw === "string" &&
    (photoRaw === "" ||
      (photoRaw.startsWith("data:image/") && photoRaw.length <= MAX_PHOTO_CHARS))
      ? photoRaw
      : undefined;
  if (photoRaw && photoDataUrl === undefined) {
    return NextResponse.json({ error: "photo too large or invalid" }, { status: 400 });
  }

  upsertMemberProfile({
    guardianId: session.guardianId,
    firstName,
    lastName,
    email,
    phone,
    facebook,
    instagram,
    lineId,
    whatsapp,
    ...(photoDataUrl !== undefined ? { photoDataUrl } : {}),
  });

  try {
    const store = await getStore();
    const row = await store.getMemberByGuardianId(session.guardianId);
    if (row?.member) {
      await store.updateMember({
        ...row.member,
        firstName,
        lastName,
        email,
        phone: phone || null,
        updatedAt: nowIso(),
      });
    }
  } catch (err) {
    console.warn("[member/profile] spine update skipped", err);
  }

  try {
    updateAdminMemberContact({
      id: session.guardianId,
      name: `${firstName} ${lastName}`.trim(),
      email,
    });
  } catch {
    /* ignore */
  }

  const found = await findGuardianForLogin(session.guardianId, email);
  if (!found) {
    // Email changed; retry with old session email then force merge via profile
    const fallback = await findGuardianForLogin(session.guardianId, session.email);
    if (!fallback) {
      return NextResponse.json({ error: "member not found" }, { status: 404 });
    }
  }

  const refreshed =
    (await findGuardianForLogin(session.guardianId, email)) ??
    (await findGuardianForLogin(session.guardianId, session.email));
  if (!refreshed) {
    return NextResponse.json({ error: "member not found" }, { status: 404 });
  }

  const newToken = createMemberSessionToken(session.guardianId, email);
  const res = NextResponse.json({
    ok: true,
    membership: {
      ...refreshed.membership,
      firstName,
      lastName,
      email,
      phone,
      facebook,
      instagram,
      lineId,
      whatsapp,
      photoDataUrl:
        photoDataUrl !== undefined
          ? photoDataUrl
          : refreshed.membership.photoDataUrl ?? "",
    },
  });
  res.headers.set("Set-Cookie", memberCookieHeader(newToken));
  return res;
}
