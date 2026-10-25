/**
 * Soft Launch admin users (officers).
 * Persists to Turso when DATABASE_URL is libsql; otherwise data/admin-users.json.
 * Bootstraps from ADMIN_ALLOWLIST + ADMIN_PASSWORD on first load.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { hashPassword, verifyPassword } from "@/lib/admin-password";

export type AdminRole = "administrator" | "officer" | "viewer";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  mustChangePassword: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type AdminUserPublic = Omit<AdminUser, "passwordHash">;

export const ADMIN_ROLES: AdminRole[] = ["administrator", "officer", "viewer"];

const DATA_PATH = join(process.cwd(), "data", "admin-users.json");
const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'officer',
  password_hash TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);
`;

type StoreFile = { users: AdminUser[]; source: "file" | "memory" | "libsql" };

let cached: StoreFile | null = null;
let libsqlReady: "unknown" | "yes" | "no" = "unknown";
let libsqlClient: {
  execute: (args: {
    sql: string;
    args?: unknown[];
  }) => Promise<{ rows: Record<string, unknown>[] }>;
  executeMultiple: (sql: string) => Promise<unknown>;
} | null = null;

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `adm_${randomBytes(8).toString("hex")}`;
}

function getAllowlist(): string[] {
  return (process.env.ADMIN_ALLOWLIST ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isLibsqlUrl(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.startsWith("libsql://") ||
    (url.startsWith("https://") && url.includes(".turso.io"))
  );
}

function toPublic(u: AdminUser): AdminUserPublic {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    mustChangePassword: u.mustChangePassword,
    active: u.active,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastLoginAt: u.lastLoginAt,
  };
}

function normalizeRole(role: string): AdminRole {
  if (role === "administrator" || role === "officer" || role === "viewer") {
    return role;
  }
  return "officer";
}

function seedUsers(): AdminUser[] {
  const allow = getAllowlist();
  const shared = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (!allow.length || !shared) return [];
  const stamp = nowIso();
  const hash = hashPassword(shared);
  return allow.map((email, i) => ({
    id: newId(),
    email,
    name: i === 0 ? "Primary administrator" : "",
    role: (i === 0 ? "administrator" : "officer") as AdminRole,
    passwordHash: hash,
    mustChangePassword: false,
    active: true,
    createdAt: stamp,
    updatedAt: stamp,
    lastLoginAt: null,
  }));
}

function persistFile(users: AdminUser[]) {
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(
      DATA_PATH,
      JSON.stringify({ users, updatedAt: nowIso() }, null, 2),
      "utf8"
    );
  } catch (err) {
    console.warn("[admin-users] file persist failed", err);
  }
}

function loadFile(): AdminUser[] | null {
  try {
    if (!existsSync(DATA_PATH)) return null;
    const raw = JSON.parse(readFileSync(DATA_PATH, "utf8")) as {
      users?: AdminUser[];
    };
    if (!Array.isArray(raw.users)) return null;
    return raw.users.map((u) => ({
      ...u,
      email: u.email.toLowerCase(),
      role: normalizeRole(u.role),
      mustChangePassword: Boolean(u.mustChangePassword),
      active: u.active !== false,
      lastLoginAt: u.lastLoginAt ?? null,
    }));
  } catch {
    return null;
  }
}

async function connectLibsql(): Promise<boolean> {
  if (libsqlReady === "yes" && libsqlClient) return true;
  if (libsqlReady === "no") return false;
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!isLibsqlUrl(databaseUrl)) {
    libsqlReady = "no";
    return false;
  }
  try {
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: databaseUrl!,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });
    await client.executeMultiple(TABLE_SQL);
    libsqlClient = client as unknown as typeof libsqlClient;
    libsqlReady = "yes";
    return true;
  } catch (err) {
    console.warn(
      "[admin-users] Turso unavailable; using file/memory.",
      err instanceof Error ? err.message : err
    );
    libsqlReady = "no";
    libsqlClient = null;
    return false;
  }
}

function rowToUser(row: Record<string, unknown>): AdminUser {
  return {
    id: String(row.id),
    email: String(row.email).toLowerCase(),
    name: String(row.name ?? ""),
    role: normalizeRole(String(row.role ?? "officer")),
    passwordHash: String(row.password_hash),
    mustChangePassword: Boolean(Number(row.must_change_password)),
    active: Boolean(Number(row.active ?? 1)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : null,
  };
}

async function loadLibsql(): Promise<AdminUser[] | null> {
  if (!(await connectLibsql()) || !libsqlClient) return null;
  const result = await libsqlClient.execute({
    sql: `SELECT id, email, name, role, password_hash, must_change_password, active, created_at, updated_at, last_login_at FROM admin_users ORDER BY created_at ASC`,
  });
  return result.rows.map((r) => rowToUser(r as Record<string, unknown>));
}

async function upsertLibsql(user: AdminUser) {
  if (!(await connectLibsql()) || !libsqlClient) return false;
  await libsqlClient.execute({
    sql: `INSERT INTO admin_users (
      id, email, name, role, password_hash, must_change_password, active, created_at, updated_at, last_login_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      name=excluded.name,
      role=excluded.role,
      password_hash=excluded.password_hash,
      must_change_password=excluded.must_change_password,
      active=excluded.active,
      updated_at=excluded.updated_at,
      last_login_at=excluded.last_login_at`,
    args: [
      user.id,
      user.email,
      user.name,
      user.role,
      user.passwordHash,
      user.mustChangePassword ? 1 : 0,
      user.active ? 1 : 0,
      user.createdAt,
      user.updatedAt,
      user.lastLoginAt,
    ],
  });
  return true;
}

async function deleteLibsql(id: string) {
  if (!(await connectLibsql()) || !libsqlClient) return false;
  await libsqlClient.execute({
    sql: `DELETE FROM admin_users WHERE id = ?`,
    args: [id],
  });
  return true;
}

async function ensureStore(): Promise<StoreFile> {
  if (cached) return cached;

  const fromLibsql = await loadLibsql();
  if (fromLibsql && fromLibsql.length > 0) {
    cached = { users: fromLibsql, source: "libsql" };
    return cached;
  }

  const fromFile = loadFile();
  if (fromFile && fromFile.length > 0) {
    cached = { users: fromFile, source: "file" };
    if (await connectLibsql()) {
      for (const u of fromFile) await upsertLibsql(u);
      cached.source = "libsql";
    }
    return cached;
  }

  const seeded = seedUsers();
  cached = {
    users: seeded,
    source: (await connectLibsql()) ? "libsql" : "file",
  };
  if (seeded.length) {
    persistFile(seeded);
    for (const u of seeded) await upsertLibsql(u);
  }
  return cached;
}

async function commit(users: AdminUser[]) {
  const store = await ensureStore();
  store.users = users;
  persistFile(users);
  if (await connectLibsql()) {
    store.source = "libsql";
    for (const u of users) await upsertLibsql(u);
  }
}

export async function listAdminUsers(): Promise<AdminUserPublic[]> {
  const store = await ensureStore();
  return store.users.map(toPublic);
}

export async function getAdminUserByEmail(
  email: string
): Promise<AdminUser | null> {
  const store = await ensureStore();
  const mail = email.trim().toLowerCase();
  return store.users.find((u) => u.email === mail) ?? null;
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const store = await ensureStore();
  return store.users.find((u) => u.id === id) ?? null;
}

export async function authenticateAdminUser(
  email: string,
  password: string
): Promise<AdminUser | null> {
  const user = await getAdminUserByEmail(email);
  if (!user || !user.active) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export async function touchAdminLogin(email: string): Promise<void> {
  const store = await ensureStore();
  const mail = email.trim().toLowerCase();
  const idx = store.users.findIndex((u) => u.email === mail);
  if (idx < 0) return;
  const next = {
    ...store.users[idx],
    lastLoginAt: nowIso(),
    updatedAt: nowIso(),
  };
  const users = [...store.users];
  users[idx] = next;
  await commit(users);
}

export type CreateAdminUserInput = {
  email: string;
  name?: string;
  role: AdminRole;
  password: string;
  mustChangePassword: boolean;
  active?: boolean;
};

export async function createAdminUser(
  input: CreateAdminUserInput
): Promise<AdminUserPublic> {
  const store = await ensureStore();
  const email = input.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Valid email required");
  }
  if (store.users.some((u) => u.email === email)) {
    throw new Error("An admin user with this email already exists");
  }
  if (!ADMIN_ROLES.includes(input.role)) {
    throw new Error("Invalid role");
  }
  if (!input.password || input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const stamp = nowIso();
  const user: AdminUser = {
    id: newId(),
    email,
    name: (input.name ?? "").trim(),
    role: input.role,
    passwordHash: hashPassword(input.password),
    mustChangePassword: Boolean(input.mustChangePassword),
    active: input.active !== false,
    createdAt: stamp,
    updatedAt: stamp,
    lastLoginAt: null,
  };
  await commit([...store.users, user]);
  return toPublic(user);
}

export type UpdateAdminUserInput = {
  name?: string;
  role?: AdminRole;
  active?: boolean;
  mustChangePassword?: boolean;
  password?: string;
};

export async function updateAdminUser(
  id: string,
  input: UpdateAdminUserInput
): Promise<AdminUserPublic> {
  const store = await ensureStore();
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error("Admin user not found");
  const current = store.users[idx];

  if (input.role && !ADMIN_ROLES.includes(input.role)) {
    throw new Error("Invalid role");
  }
  if (input.password !== undefined && input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // Keep at least one active administrator
  const nextRole = input.role ?? current.role;
  const nextActive = input.active ?? current.active;
  if (current.role === "administrator" && current.active) {
    const otherAdmins = store.users.filter(
      (u) =>
        u.id !== id && u.role === "administrator" && u.active
    );
    if (
      otherAdmins.length === 0 &&
      (nextRole !== "administrator" || nextActive === false)
    ) {
      throw new Error("Keep at least one active administrator");
    }
  }

  const next: AdminUser = {
    ...current,
    name: input.name !== undefined ? input.name.trim() : current.name,
    role: nextRole,
    active: nextActive,
    mustChangePassword:
      input.mustChangePassword !== undefined
        ? Boolean(input.mustChangePassword)
        : current.mustChangePassword,
    passwordHash: input.password
      ? hashPassword(input.password)
      : current.passwordHash,
    updatedAt: nowIso(),
  };
  const users = [...store.users];
  users[idx] = next;
  await commit(users);
  return toPublic(next);
}

export async function deleteAdminUser(id: string): Promise<void> {
  const store = await ensureStore();
  const target = store.users.find((u) => u.id === id);
  if (!target) throw new Error("Admin user not found");
  if (target.role === "administrator" && target.active) {
    const otherAdmins = store.users.filter(
      (u) => u.id !== id && u.role === "administrator" && u.active
    );
    if (otherAdmins.length === 0) {
      throw new Error("Cannot remove the last active administrator");
    }
  }
  const users = store.users.filter((u) => u.id !== id);
  await commit(users);
  await deleteLibsql(id);
}

export async function changeAdminPassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<AdminUserPublic> {
  const user = await authenticateAdminUser(email, currentPassword);
  if (!user) throw new Error("Current password is incorrect");
  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }
  return updateAdminUser(user.id, {
    password: newPassword,
    mustChangePassword: false,
  });
}

/** Test helper */
export function resetAdminUsersCache() {
  cached = null;
  libsqlReady = "unknown";
  libsqlClient = null;
}
