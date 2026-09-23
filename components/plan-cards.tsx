"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { PricingContent } from "@/lib/contentContext";
import { formatMoneyForLocale, planCopy } from "@/lib/i18n";
import { useLocale } from "@/lib/localeContext";
import {
  annualPrice,
  PLANS,
  type BillingInterval,
  type NamedPlanId,
} from "@/lib/membership";
import { cn } from "@/lib/utils";

const JOIN_PLAN_IDS: NamedPlanId[] = ["wdt199", "wdt399", "wdt999"];

export function PlanCards({
  interval = "monthly",
  selectedId,
  onSelect,
  ctaHref = true,
  displayPlans,
}: {
  interval?: BillingInterval;
  selectedId?: string;
  onSelect?: (id: NamedPlanId) => void;
  ctaHref?: boolean;
  displayPlans?: PricingContent[];
}) {
  const { locale, t } = useLocale();
  const cards =
    displayPlans && displayPlans.length
      ? displayPlans.map((plan, i) => {
          const catalog = PLANS[i] ?? PLANS[1];
          const id = JOIN_PLAN_IDS[i] ?? catalog.id;
          const copy = planCopy(id, locale);
          return {
            id,
            name: locale === "th" ? copy.name : plan.name,
            blurb: copy.blurb,
            perks: copy.perks,
            monthly: plan.monthlyPrice,
            annual: plan.annualPrice,
            popular: plan.recommended,
          };
        })
      : PLANS.map((plan) => {
          const copy = planCopy(plan.id, locale);
          return {
            id: plan.id,
            name: copy.name,
            blurb: copy.blurb,
            perks: copy.perks,
            monthly: plan.monthly,
            annual: annualPrice(plan.monthly),
            popular: Boolean(plan.popular),
          };
        });

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {cards.map((plan) => {
        const price = interval === "annual" ? plan.annual : plan.monthly;
        const selected = selectedId === plan.id;
        return (
          <Card
            key={plan.id}
            className={cn(
              "flex h-full flex-col rounded-2xl border-border/80 bg-white shadow-sm",
              plan.popular && "ring-2 ring-brand-orange",
              selected && "border-brand-orange ring-2 ring-brand-orange"
            )}
          >
            <CardHeader className="space-y-3 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="font-heading text-2xl">{plan.name}</CardTitle>
                {plan.popular && (
                  <Badge className="bg-brand-orange hover:bg-brand-deep">{t("landing.recommended")}</Badge>
                )}
              </div>
              <CardDescription>{plan.blurb}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6 pt-0">
              <p className="font-heading text-3xl font-extrabold text-brand-ink sm:text-4xl">
                {formatMoneyForLocale(price, locale)}
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  /{interval === "annual" ? t("interval.year") : t("interval.month")}
                </span>
              </p>
              {interval === "annual" && (
                <p className="mt-1 text-xs text-muted-foreground">{t("landing.twoMonthsFree")}</p>
              )}
              <ul className="mt-5 space-y-2 text-sm">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              {ctaHref && !onSelect ? (
                <Button asChild className="w-full" size="lg">
                  <Link href={`/join?plan=${plan.id}&interval=${interval}`}>{t("landing.choosePlan")}</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  variant={selected ? "default" : "outline"}
                  className="w-full"
                  onClick={() => onSelect?.(plan.id)}
                >
                  {selected ? t("landing.selected") : t("landing.choosePlan")}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
