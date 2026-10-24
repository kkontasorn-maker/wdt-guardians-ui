"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearMembership,
  Membership,
  readMembership,
  writeMembership,
} from "@/lib/membership";

type LoadState = "loading" | "ready" | "empty" | "error";

export function useMembership() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [fromSession, setFromSession] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/member/me", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { membership?: Membership };
        if (data.membership) {
          writeMembership(data.membership);
          setMembership(data.membership);
          setFromSession(true);
          setState("ready");
          return;
        }
      }
    } catch {
      /* fall through to localStorage */
    }

    try {
      const next = readMembership();
      setMembership(next);
      setFromSession(false);
      setState(next ? "ready" : "empty");
    } catch {
      setMembership(null);
      setFromSession(false);
      setState("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 200);
    const onChange = () => {
      void refresh();
    };
    window.addEventListener("wdt-membership-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("wdt-membership-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const save = useCallback((next: Membership) => {
    writeMembership(next);
    setMembership(next);
    setState("ready");
  }, []);

  const clear = useCallback(async () => {
    try {
      await fetch("/api/member/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    clearMembership();
    setMembership(null);
    setFromSession(false);
    setState("empty");
  }, []);

  return { membership, state, save, clear, refresh, fromSession };
}
