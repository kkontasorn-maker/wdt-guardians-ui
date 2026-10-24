"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateForLocale, formatMoneyForLocale, planCopy } from "@/lib/i18n";
import { useLocale } from "@/lib/localeContext";
import { periodAmount, type Membership } from "@/lib/membership";

type Props = {
  membership: Membership;
};

export function GuardianBadge({ membership }: Props) {
  const { locale, t } = useLocale();
  const [busy, setBusy] = useState(false);

  const copy = planCopy(membership.planId === "custom" ? "wdt399" : membership.planId, locale);
  const planName = membership.planId === "custom" ? t("plans.custom.name") : copy.name;
  const supportLevel = `${planName} · ${formatMoneyForLocale(
    periodAmount(membership.amount, membership.interval),
    locale
  )} / ${membership.interval === "annual" ? t("interval.year") : t("interval.month")}`;

  async function downloadBadge() {
    setBusy(true);
    try {
      const width = 720;
      const height = 420;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");

      ctx.fillStyle = "#1c1917";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(226, 122, 47, 0.28)";
      ctx.beginPath();
      ctx.arc(width - 40, -20, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.arc(80, height + 20, 120, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "600 18px system-ui, sans-serif";
      ctx.fillText(t("success.brand").toUpperCase(), 48, 56);

      if (membership.photoDataUrl) {
        const img = await loadImage(membership.photoDataUrl);
        const size = 88;
        const x = width - 48 - size;
        const y = 40;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "500 16px system-ui, sans-serif";
      ctx.fillText(t("success.guardianId").toUpperCase(), 48, 140);

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 40px system-ui, sans-serif";
      wrapText(ctx, membership.memberId, 48, 190, width - 96, 46);

      const name = `${membership.firstName} ${membership.lastName}`.trim();
      ctx.font = "600 22px system-ui, sans-serif";
      ctx.fillText(name, 48, 260);

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "500 14px system-ui, sans-serif";
      ctx.fillText(t("success.supportLevel").toUpperCase(), 48, 310);
      ctx.fillStyle = "#ffffff";
      ctx.font = "500 18px system-ui, sans-serif";
      wrapText(ctx, supportLevel, 48, 338, width / 2 - 64, 24);

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "500 14px system-ui, sans-serif";
      ctx.fillText(t("success.memberSince").toUpperCase(), width / 2 + 16, 310);
      ctx.fillStyle = "#ffffff";
      ctx.font = "500 18px system-ui, sans-serif";
      ctx.fillText(formatDateForLocale(membership.joinedAt, locale), width / 2 + 16, 338);

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${membership.memberId}-guardian-badge.png`;
      link.click();
      toast.success(t("manage.badgeDownloaded"));
    } catch {
      toast.error(t("manage.badgeDownloadFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-brand-ink px-6 py-8 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-brand-orange/25" />
        <div className="pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="flex items-start justify-between gap-4">
          <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            {t("success.brand")}
          </p>
          {membership.photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={membership.photoDataUrl}
              alt=""
              className="relative h-16 w-16 rounded-full border-2 border-white/30 object-cover"
            />
          ) : null}
        </div>
        <p className="relative mt-6 text-xs font-medium uppercase tracking-[0.16em] text-white/55">
          {t("success.guardianId")}
        </p>
        <p className="relative mt-1 break-all font-heading text-2xl font-extrabold tracking-wide sm:text-3xl sm:tracking-[0.08em]">
          {membership.memberId}
        </p>
        <p className="relative mt-3 text-base font-medium text-white/90">
          {membership.firstName} {membership.lastName}
        </p>
        <dl className="relative mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-white/55">
              {t("success.supportLevel")}
            </dt>
            <dd className="mt-1 font-medium text-white">{supportLevel}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-white/55">
              {t("success.memberSince")}
            </dt>
            <dd className="mt-1 font-medium text-white">
              {formatDateForLocale(membership.joinedAt, locale)}
            </dd>
          </div>
        </dl>
      </div>
      <Button
        type="button"
        size="lg"
        className="w-full sm:w-auto"
        disabled={busy}
        onClick={() => {
          void downloadBadge();
        }}
      >
        <Download className="h-4 w-4" />
        {busy ? t("manage.badgeDownloading") : t("manage.downloadBadge")}
      </Button>
    </div>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}
