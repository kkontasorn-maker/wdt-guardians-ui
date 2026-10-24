"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings2, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMembership } from "@/lib/hooks";
import { useLocale } from "@/lib/localeContext";
import { cn } from "@/lib/utils";

function initials(firstName: string, lastName: string) {
  const a = firstName.trim().charAt(0);
  const b = lastName.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "G";
}

export function AccountMenu({ className }: { className?: string }) {
  const { membership, state, clear } = useMembership();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (state === "loading") {
    return (
      <div
        className={cn("h-11 w-11 animate-pulse rounded-full bg-muted", className)}
        aria-hidden
      />
    );
  }

  if (!membership) {
    return (
      <Button asChild className={className}>
        <Link href="/join">{t("header.join")}</Link>
      </Button>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex h-11 min-h-11 items-center gap-2 rounded-full border border-border/80 bg-white py-1 pl-1 pr-3 text-sm font-medium text-brand-ink shadow-sm transition hover:border-brand-orange/50"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-brand-orange font-heading text-xs font-extrabold text-white">
            {initials(membership.firstName, membership.lastName)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[7rem] truncate sm:inline">
          {membership.firstName}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border/80 bg-white p-1.5 shadow-md"
        >
          <div className="border-b border-border/70 px-3 py-2">
            <p className="truncate font-heading text-sm font-extrabold">
              {membership.firstName} {membership.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{membership.memberId}</p>
          </div>
          <Link
            href="/manage"
            role="menuitem"
            className="mt-1 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <UserRound className="h-4 w-4" />
            {t("header.memberPortal")}
          </Link>
          <Link
            href="/manage?tab=settings"
            role="menuitem"
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <Settings2 className="h-4 w-4" />
            {t("header.editProfile")}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 text-left text-sm text-destructive hover:bg-accent"
            onClick={async () => {
              setOpen(false);
              await clear();
            }}
          >
            <LogOut className="h-4 w-4" />
            {t("header.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
