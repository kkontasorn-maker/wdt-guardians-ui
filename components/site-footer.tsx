"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { useLocale } from "@/lib/localeContext";

export function SiteFooter() {
  const pathname = usePathname();
  const { t } = useLocale();
  if (pathname === "/join") return null;

  return (
    <footer className="mt-auto border-t border-border bg-brand-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Logo />
          <p className="mt-4 text-sm font-medium text-brand-ink">{t("footer.foundation")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("footer.location")}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("footer.prototype")}
          </p>
        </div>
        <nav className="-mx-2 flex flex-wrap text-sm text-muted-foreground">
          <Link
            href="/#program"
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 hover:text-brand-ink"
          >
            {t("header.program")}
          </Link>
          <Link
            href="/#impact"
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 hover:text-brand-ink"
          >
            {t("header.impact")}
          </Link>
          <Link
            href="/#faq"
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 hover:text-brand-ink"
          >
            {t("header.faq")}
          </Link>
          <Link
            href="/join"
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 hover:text-brand-ink"
          >
            {t("header.join")}
          </Link>
          <Link
            href="/manage"
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 hover:text-brand-ink"
          >
            {t("footer.manage")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
