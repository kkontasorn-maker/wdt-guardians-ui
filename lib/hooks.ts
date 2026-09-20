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

  const refresh = useCallback(() => {
    try {
      const next = readMembership();
      setMembership(next);
      setState(next ? "ready" : "empty");
    } catch {
      setMembership(null);
      setState("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 500);
    window.addEventListener("wdt-membership-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("wdt-membership-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const save = useCallback((next: Membership) => {
    writeMembership(next);
    setMembership(next);
    setState("ready");
  }, []);

  const clear = useCallback(() => {
    clearMembership();
    setMembership(null);
    setState("empty");
  }, []);

  return { membership, state, save, clear, refresh };
}
