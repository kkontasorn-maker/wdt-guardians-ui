"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMembership } from "@/lib/hooks";
import { useLocale } from "@/lib/localeContext";
import { addInterval, generateReceiptId, planById, type NamedPlanId } from "@/lib/membership";
import { formatMoneyForLocale } from "@/lib/i18n";
import { mobileBankById } from "@/lib/spine/mobile-banks";

type StoredReturn = {
  chargeId?: string;
  guardianId?: string;
  subscriptionId?: string;
  amountThb?: number;
  planId?: string;
  interval?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bankId?: string;
};

function readStoredReturn(): StoredReturn | null {
  try {
    const raw = sessionStorage.getItem("wdt_mb_return");
    if (!raw) return null;
    return JSON.parse(raw) as StoredReturn;
  } catch {
    return null;
  }
}

function MobileBankingWaitInner() {
  const search = useSearchParams();
  const router = useRouter();
  const { save } = useMembership();
  const { locale, t } = useLocale();
  const stored = useMemo(() => readStoredReturn(), []);

  const chargeId = search.get("chargeId") || stored?.chargeId || "";
  const guardianId = search.get("guardianId") || stored?.guardianId || "";
  const subscriptionId = search.get("subscriptionId") || stored?.subscriptionId || "";
  const amountThb = Number(
    search.get("amountThb") || stored?.amountThb || "0"
  );
  const planId = ((search.get("planId") || stored?.planId) as NamedPlanId | null) ?? "wdt399";
  const interval =
    (search.get("interval") || stored?.interval) === "annual" ? "annual" : "monthly";
  const firstName = search.get("firstName") || stored?.firstName || "";
  const lastName = search.get("lastName") || stored?.lastName || "";
  const email = search.get("email") || stored?.email || "";
  const phone = search.get("phone") || stored?.phone || "";
  const bankId = search.get("bankId") || stored?.bankId || "";
  const bank = mobileBankById(bankId);
  const bankLabel = locale === "th" ? bank?.nameTh ?? bankId : bank?.nameEn ?? bankId;

  const [status, setStatus] = useState("pending");
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!chargeId || done.current) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/membership/charges/${encodeURIComponent(chargeId)}`, {
          credentials: "include",
        });
        const data = (await res.json()) as {
          error?: string;
          paid?: boolean;
          status?: string;
          activated?: boolean;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? t("join.mobileBankPollError"));
          return;
        }
        if (data.status) setStatus(data.status);

        if (data.paid && (data.activated || data.status === "successful")) {
          done.current = true;
          try {
            sessionStorage.removeItem("wdt_mb_return");
          } catch {
            /* ignore */
          }
          const now = new Date().toISOString();
          const plan = planById(planId);
          save({
            memberId: guardianId,
            firstName,
            lastName,
            email,
            phone,
            zip: "",
            planId,
            amount: plan.monthly,
            interval,
            status: "active",
            joinedAt: now,
            nextBillingAt: addInterval(now, interval),
            pausedAt: null,
            canceledAt: null,
            lastFour: "",
            cardBrand: bankLabel || "Bank app",
            paymentMethod: "mobile_banking",
            dedication: "",
            receipts: [
              {
                id: generateReceiptId(),
                date: now,
                amount: amountThb || plan.monthly,
                interval,
                status: "paid",
              },
            ],
          });
          router.replace("/join/success");
        }
      } catch {
        if (!cancelled) setError(t("join.mobileBankPollError"));
      }
    };

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    amountThb,
    bankLabel,
    chargeId,
    email,
    firstName,
    guardianId,
    interval,
    lastName,
    phone,
    planId,
    router,
    save,
    t,
  ]);

  if (!chargeId || !guardianId) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-extrabold">{t("join.mobileBankMissing")}</h1>
        <Button asChild className="mt-6">
          <Link href="/join">{t("join.back")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
        {t("join.mobileBankKicker")}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold">{t("join.mobileBankHeadline")}</h1>
      <p className="mt-3 text-muted-foreground">
        {t("join.mobileBankBody", {
          bank: bankLabel || t("payment.mobile_banking.short"),
          amount: formatMoneyForLocale(amountThb || planById(planId).monthly, locale),
        })}
      </p>

      <div className="mt-8 flex flex-col items-center rounded-2xl border border-border/80 bg-white p-6 shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-brand-deep">
          <Smartphone className="h-7 w-7" />
        </span>
        <p className="mt-4 text-center font-heading text-lg font-extrabold">
          {bankLabel || t("payment.mobile_banking.name")}
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("join.mobileBankWaiting")} ({status})
        </p>
        {subscriptionId && (
          <p className="mt-2 text-xs text-muted-foreground">
            {guardianId} · {subscriptionId.slice(0, 12)}…
          </p>
        )}
      </div>

      <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>{t("join.mobileBankStep1")}</li>
        <li>{t("join.mobileBankStep2")}</li>
        <li>{t("join.mobileBankStep3")}</li>
      </ol>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <p className="mt-6 text-sm text-muted-foreground">{t("join.mobileBankHint")}</p>

      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline">
          <Link href="/join">{t("join.back")}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function JoinMobileBankingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-5 py-16 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <MobileBankingWaitInner />
    </Suspense>
  );
}
