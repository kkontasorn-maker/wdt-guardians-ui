"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { writeMembership, type Membership } from "@/lib/membership";
import { useLocale } from "@/lib/localeContext";

function ManageLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/manage";
  const { t } = useLocale();
  const [guardianId, setGuardianId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/member/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guardianId, email }),
      });
      const data = (await res.json()) as {
        error?: string;
        membership?: Membership;
      };
      if (!res.ok || !data.membership) {
        setError(data.error ?? t("manage.loginFailed"));
        return;
      }
      writeMembership(data.membership);
      router.replace(next.startsWith("/manage") ? next : "/manage");
      router.refresh();
    } catch {
      setError(t("manage.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-slate">
        {t("manage.memberPortal")}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold">{t("manage.loginHeadline")}</h1>
      <p className="mt-3 text-muted-foreground">{t("manage.loginBody")}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="guardianId">{t("manage.guardianId")}</Label>
          <Input
            id="guardianId"
            placeholder="WDTG-243539"
            autoComplete="username"
            value={guardianId}
            onChange={(e) => setGuardianId(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("manage.loginEmail")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t("manage.signingIn") : t("manage.signIn")}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {t("manage.loginJoinHint")}{" "}
        <Link href="/join" className="font-medium text-brand-deep underline-offset-4 hover:underline">
          {t("success.become")}
        </Link>
      </p>
    </div>
  );
}

export default function ManageLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <ManageLoginForm />
    </Suspense>
  );
}
