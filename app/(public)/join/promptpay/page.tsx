"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMembership } from "@/lib/hooks";
import { useLocale } from "@/lib/localeContext";
import { addInterval, generateReceiptId, planById, type NamedPlanId } from "@/lib/membership";
import { formatMoneyForLocale } from "@/lib/i18n";

function PromptPayWaitInner() {
  const search = useSearchParams();
  const router = useRouter();
  const { save } = useMembership();
  const { locale, t } = useLocale();

  const chargeId = search.get("chargeId") ?? "";
  const guardianId = search.get("guardianId") ?? "";
  const subscriptionId = search.get("subscriptionId") ?? "";
  const amountThb = Number(search.get("amountThb") ?? "0");
  const planId = (search.get("planId") as NamedPlanId | null) ?? "wdt399";
  const interval = search.get("interval") === "annual" ? "annual" : "monthly";
  const firstName = search.get("firstName") ?? "";
  const lastName = search.get("lastName") ?? "";
  const email = search.get("email") ?? "";
  const phone = search.get("phone") ?? "";
  const initialQr = search.get("qr") ?? "";

  const [qrUrl, setQrUrl] = useState(initialQr ? decodeURIComponent(initialQr) : "");
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
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
          qrImageUrl?: string | null;
          activated?: boolean;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? t("join.promptpayPollError"));
          return;
        }
        if (data.qrImageUrl) setQrUrl(data.qrImageUrl);
        if (data.status) setStatus(data.status);

        // Redirect once Omise reports paid (activation may still be catching up).
        if (data.paid || data.status === "successful") {
          done.current = true;
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
            cardBrand: "PromptPay",
            paymentMethod: "promptpay",
            dedication: "",
            facebook: "",
            instagram: "",
            lineId: "",
            whatsapp: "",
            photoDataUrl: "",
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
        if (!cancelled) setError(t("join.promptpayPollError"));
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

  async function downloadQr() {
    if (!qrUrl) return;
    setDownloadBusy(true);
    setDownloadError(null);
    try {
      const res = await fetch(qrUrl, { mode: "cors" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${guardianId || "wdt-guardian"}-promptpay-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Cross-origin QR hosts may block blob download — open image for save/screenshot.
      try {
        window.open(qrUrl, "_blank", "noopener,noreferrer");
      } catch {
        setDownloadError(t("join.promptpayDownloadError"));
      }
    } finally {
      setDownloadBusy(false);
    }
  }

  if (!chargeId || !guardianId) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <h1 className="text-2xl font-extrabold">{t("join.promptpayMissing")}</h1>
        <Button asChild className="mt-6">
          <Link href="/join">{t("join.back")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
        PromptPay
      </p>
      <h1 className="mt-2 text-3xl font-extrabold">{t("join.promptpayHeadline")}</h1>
      <p className="mt-3 text-muted-foreground">
        {t("join.promptpayBody", {
          amount: formatMoneyForLocale(amountThb || planById(planId).monthly, locale),
        })}
      </p>

      <div className="mt-8 flex flex-col items-center rounded-2xl border border-border/80 bg-white p-6 shadow-sm">
        {qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrUrl}
            alt="PromptPay QR"
            className="h-56 w-56 rounded-lg border border-border bg-white object-contain"
          />
        ) : (
          <div className="flex h-56 w-56 items-center justify-center rounded-lg border border-dashed border-border">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          </div>
        )}
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("join.promptpayWaiting")} ({status})
        </p>
        {subscriptionId && (
          <p className="mt-2 text-xs text-muted-foreground">
            {guardianId} · {subscriptionId.slice(0, 12)}…
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="mt-5 w-full sm:w-auto"
          disabled={!qrUrl || downloadBusy}
          onClick={() => void downloadQr()}
        >
          {downloadBusy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("join.promptpayDownloading")}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {t("join.promptpayDownload")}
            </>
          )}
        </Button>
        {downloadError && (
          <p className="mt-2 text-center text-sm text-destructive">{downloadError}</p>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <p className="mt-6 rounded-md border border-brand-orange/25 bg-accent/60 px-3 py-2.5 text-sm font-medium text-brand-ink">
        {t("join.promptpayReturn")}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">{t("join.promptpayHint")}</p>

      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline">
          <Link href="/join">{t("join.back")}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function JoinPromptPayPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-5 py-16 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <PromptPayWaitInner />
    </Suspense>
  );
}
