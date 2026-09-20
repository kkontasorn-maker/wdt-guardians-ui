"use client";

import Link from "next/link";
import { Building2, CreditCard, RefreshCw, Scale, ShieldCheck, Users } from "lucide-react";
import { PricingSection } from "@/components/pricing-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSiteContent } from "@/lib/contentContext";

const TRUST_ICONS = [Building2, CreditCard, RefreshCw, Scale];

export function MarketingLanding() {
  const { content } = useSiteContent();

  return (
    <div>
      <section
        id="program"
        className="mx-auto grid w-full max-w-6xl scroll-mt-20 items-center gap-8 px-5 py-10 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-24"
      >
        <div>
          <h1 className="max-w-xl text-[1.85rem] font-extrabold leading-[1.15] sm:text-4xl lg:text-5xl">
            {content.hero.headline}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {content.hero.subhead}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/join">{content.hero.primaryButtonText}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#plans">{content.hero.secondaryButtonText}</Link>
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-brand-ink px-5 py-10 text-white sm:px-8 sm:py-12">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-brand-orange/25" />
          <div className="pointer-events-none absolute -bottom-12 left-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-16 bottom-16 h-16 w-16 rounded-full border border-white/15" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            A circle around the next case
          </p>
          <div className="relative mt-8 grid grid-cols-3 gap-4">
            {[Users, ShieldCheck, Building2].map((Icon, i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-2xl bg-white/10"
              >
                <Icon className="h-8 w-8 text-brand-orange" strokeWidth={1.75} />
              </div>
            ))}
          </div>
          <p className="relative mt-8 max-w-sm text-sm leading-relaxed text-white/70">
            Neighbours report. Coordinators verify. A field team responds. Evidence is followed up.
            Guardians keep that chain staffed.
          </p>
        </div>
      </section>

      {content.trustCards.length > 0 && (
        <section className="px-5 pb-6 sm:px-6">
          <div className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.trustCards.map((item, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <Card key={`${item.title}-${i}`} className="rounded-2xl border-border/80 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-brand-deep">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-4 text-lg font-extrabold">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section id="impact" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">Impact</p>
        <h2 className="mt-3 max-w-xl text-3xl font-extrabold">What a steady gift actually pays for.</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            {
              value: "Verification",
              body: "Someone picks up the report, checks the facts, and decides if a field visit is needed.",
            },
            {
              value: "Field response",
              body: "A team can leave the same day — transport, handling, and a safe place to take the animal.",
            },
            {
              value: "Evidence follow-up",
              body: "Photos, notes, and statements are kept so the case does not evaporate after the street is quiet.",
            },
          ].map((item) => (
            <div key={item.value}>
              <h3 className="text-xl font-extrabold">{item.value}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <PricingSection />

      <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-5 pb-20 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">FAQ</p>
        <h2 className="mt-3 text-3xl font-extrabold">Questions before you join</h2>
        {content.faq.length > 0 ? (
          <Accordion type="single" collapsible className="mt-6">
            {content.faq.map((item, i) => (
              <AccordionItem key={`${item.question}-${i}`} value={`faq-${i}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">No FAQ items yet.</p>
        )}
      </section>
    </div>
  );
}
