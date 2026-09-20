"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const [lang, setLang] = useState<"TH" | "EN">("EN");

  return (
    <div
      className="inline-flex h-11 items-center rounded-full border border-border bg-white text-xs font-semibold"
      role="group"
      aria-label="Language (visual only)"
    >
      {(["TH", "EN"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
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
