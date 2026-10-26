"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/localeContext";
import {
  termsBodyParagraphs,
  termsForLocale,
  useTermsContent,
} from "@/lib/termsContent";

export default function TermsPage() {
  const { locale, t } = useLocale();
  const { content } = useTermsContent();
  const terms = termsForLocale(content, locale);
  const paragraphs = termsBodyParagraphs(terms.body);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
        {t("join.termsKicker")}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold text-brand-ink sm:text-4xl">
        {terms.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{terms.updatedLabel}</p>

      <div className="mt-8 space-y-4 text-base leading-relaxed text-brand-ink">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/join">{t("join.termsBackToJoin")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{t("join.termsBackHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
