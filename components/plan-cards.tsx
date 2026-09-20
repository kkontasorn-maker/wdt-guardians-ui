import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { PricingContent } from "@/lib/contentContext";
import {
  annualPrice,
  formatMoney,
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
  const cards =
    displayPlans && displayPlans.length
      ? displayPlans.map((plan, i) => {
          const catalog = PLANS[i] ?? PLANS[1];
          return {
            id: JOIN_PLAN_IDS[i] ?? catalog.id,
            name: plan.name,
            blurb: catalog.blurb,
            perks: catalog.perks,
            monthly: plan.monthlyPrice,
            annual: plan.annualPrice,
            popular: plan.recommended,
          };
        })
      : PLANS.map((plan) => ({
          id: plan.id,
          name: plan.name,
          blurb: plan.blurb,
          perks: plan.perks,
          monthly: plan.monthly,
          annual: annualPrice(plan.monthly),
          popular: Boolean(plan.popular),
        }));

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
                  <Badge className="bg-brand-orange hover:bg-brand-deep">Recommended</Badge>
                )}
              </div>
              <CardDescription>{plan.blurb}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6 pt-0">
              <p className="font-heading text-3xl font-extrabold text-brand-ink sm:text-4xl">
                {formatMoney(price)}
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  /{interval === "annual" ? "year" : "month"}
                </span>
              </p>
              {interval === "annual" && (
                <p className="mt-1 text-xs text-muted-foreground">Two months free versus monthly giving.</p>
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
                  <Link href={`/join?plan=${plan.id}&interval=${interval}`}>Choose this plan</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  variant={selected ? "default" : "outline"}
                  className="w-full"
                  onClick={() => onSelect?.(plan.id)}
                >
                  {selected ? "Selected" : "Choose this plan"}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
