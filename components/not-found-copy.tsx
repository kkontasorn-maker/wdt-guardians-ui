"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/localeContext";

export function NotFoundCopy() {
  const { t } = useLocale();

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-slate">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">{t("notFound.headline")}</h1>
      <p className="mt-3 text-muted-foreground">
        {t("notFound.body")}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">{t("notFound.home")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/manage">{t("notFound.portal")}</Link>
        </Button>
      </div>
    </div>
  );
}
