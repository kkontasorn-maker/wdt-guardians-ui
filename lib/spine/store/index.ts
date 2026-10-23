import { createMemoryStore, type MembershipStore } from "./memory";

let cached: MembershipStore | null = null;

function resolveMode(databaseUrl: string | undefined): "memory" | "sqlite" | "postgres" {
  if (!databaseUrl || databaseUrl.trim() === "" || databaseUrl === ":memory:") {
    return "memory";
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
 * file:… / *.sqlite → better-sqlite3. postgres:// → stub that falls back to memory
 * until a Postgres migration is wired (documented in soft-launch-spine.md).
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

  if (mode === "postgres") {
    console.warn(
      "[spine] Postgres DATABASE_URL set but Soft Launch spine uses memory until Postgres adapter lands. Schema shapes match drizzle sqlite definitions."
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
