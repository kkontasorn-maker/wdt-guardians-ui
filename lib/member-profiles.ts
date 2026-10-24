/**
 * Soft Launch member profile overlays (name/contact/social).
 * Merged onto Membership at login; persisted under data/ when possible.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type MemberProfile = {
  guardianId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
  lineId?: string;
  whatsapp?: string;
  photoDataUrl?: string;
  updatedAt: string;
};

type StoreFile = { profiles: Record<string, MemberProfile> };

const DATA_PATH = join(process.cwd(), "data", "member-profiles.json");

let cached: StoreFile | null = null;

function load(): StoreFile {
  if (cached) return cached;
  if (existsSync(DATA_PATH)) {
    try {
      cached = JSON.parse(readFileSync(DATA_PATH, "utf8")) as StoreFile;
      if (!cached.profiles) cached.profiles = {};
      return cached;
    } catch {
      /* fall through */
    }
  }
  cached = { profiles: {} };
  return cached;
}

function persist(store: StoreFile) {
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.warn("[member-profiles] persist failed", err);
  }
}

export function getMemberProfile(guardianId: string): MemberProfile | null {
  const id = guardianId.trim().toUpperCase();
  return load().profiles[id] ?? null;
}

export function upsertMemberProfile(
  input: Omit<MemberProfile, "updatedAt"> & { updatedAt?: string }
): MemberProfile {
  const store = load();
  const id = input.guardianId.trim().toUpperCase();
  const prev = store.profiles[id];
  const next: MemberProfile = {
    ...prev,
    ...input,
    guardianId: id,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
  store.profiles[id] = next;
  cached = store;
  persist(store);
  return next;
}
