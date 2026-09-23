"use client";

import { useLocale } from "@/lib/localeContext";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  const lang = locale === "th" ? "TH" : "EN";

  return (
    <div
      className="inline-flex h-11 items-center rounded-full border border-border bg-white text-xs font-semibold"
      role="group"
      aria-label={t("header.language")}
    >
      {(["TH", "EN"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code === "TH" ? "th" : "en")}
          aria-pressed={lang === code}
          className={cn(
            "inline-flex h-11 min-h-11 min-w-11 items-center justify-center rounded-full px-3 transition-colors",
            lang === code ? "bg-brand-orange text-white" : "text-muted-foreground hover:text-brand-ink"
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
