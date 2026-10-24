"use client";

import { useEffect, useState } from "react";
import type { AdminBook } from "@/lib/admin-book";

export function useAdminBook() {
  const [book, setBook] = useState<AdminBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/book", { credentials: "include" });
        if (res.status === 401) {
          window.location.href = "/admin/login?next=" + encodeURIComponent(window.location.pathname);
          return;
        }
        if (!res.ok) throw new Error(`book ${res.status}`);
        const data = (await res.json()) as AdminBook;
        if (!cancelled) {
          setBook(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "failed to load book");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { book, loading, error };
}
