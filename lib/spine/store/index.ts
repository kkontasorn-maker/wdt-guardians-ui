import { createMemoryStore, type MembershipStore } from "./memory";

let cached: MembershipStore | null = null;

function resolveMode(
  databaseUrl: string | undefined
): "memory" | "sqlite" | "libsql" | "postgres" {
  if (!databaseUrl || databaseUrl.trim() === "" || databaseUrl === ":memory:") {
    return "memory";
  }
  if (
    databaseUrl.startsWith("libsql://") ||
    (databaseUrl.startsWith("https://") && databaseUrl.includes(".turso.io"))
  ) {
    return "libsql";
  }
  if (
    databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("postgresql://")
  ) {
    return "postgres";
  }
  if (
    databaseUrl.startsWith("file:") ||
    databaseUrl.startsWith("sqlite:") ||
    databaseUrl.endsWith(".sqlite") ||
    databaseUrl.endsWith(".db")
  ) {
    return "sqlite";
  }
  // Unknown scheme → safe memory so build/dev never crash
  return "memory";
}

/**
 * Lazy store. Missing / unknown DATABASE_URL → in-memory (build-safe).
 * file:… / *.sqlite → better-sqlite3 (local).
 * libsql:// or *.turso.io → Turso (Vercel Soft Launch).
 * postgres:// → warn + memory until Postgres adapter lands.
 */
export async function getStore(): Promise<MembershipStore> {
  if (cached) return cached;

  const databaseUrl = process.env.DATABASE_URL;
  const mode = resolveMode(databaseUrl);

  if (mode === "sqlite" && databaseUrl) {
    try {
      const { createSqliteStore } = await import("./sqlite");
      cached = createSqliteStore(databaseUrl);
      return cached;
    } catch (err) {
      console.warn(
        "[spine] SQLite store failed; using in-memory.",
        err instanceof Error ? err.message : err
      );
      cached = createMemoryStore();
      return cached;
    }
  }

  if (mode === "libsql" && databaseUrl) {
    try {
      const { createLibsqlStore } = await import("./libsql");
      cached = await createLibsqlStore(databaseUrl);
      return cached;
    } catch (err) {
      console.warn(
        "[spine] libSQL/Turso store failed; using in-memory.",
        err instanceof Error ? err.message : err
      );
      cached = createMemoryStore();
      return cached;
    }
  }

  if (mode === "postgres") {
    console.warn(
      "[spine] Postgres DATABASE_URL set but Soft Launch spine uses memory until Postgres adapter lands. Prefer Turso (libsql://) for Vercel."
    );
  }

  cached = createMemoryStore();
  return cached;
}

/** Test helper — reset singleton between suites. */
export function resetStoreCache() {
  cached = null;
}

export type { MembershipStore };
