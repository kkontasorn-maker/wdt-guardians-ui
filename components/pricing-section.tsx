"use client";

import { useState } from "react";
import { PlanCards } from "@/components/plan-cards";
import { Button } from "@/components/ui/button";
import { useSiteContent } from "@/lib/contentContext";
import type { BillingInterval } from "@/lib/membership";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const { content } = useSiteContent();
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <section id="plans" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">Program</p>
        <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Choose the Guardian plan that fits.</h2>
        <p className="mt-3 text-muted-foreground">
          Monthly or annual giving in Thai baht. Annual plans include two months free. Every plan funds
          operating capacity — not a named case.
        </p>
        <div className="mt-6 grid w-full grid-cols-2 gap-1 rounded-full border border-border bg-white p-1 sm:inline-flex sm:w-auto">
          {(["monthly", "annual"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              className={cn(
                "h-11 min-h-11 rounded-full capitalize",
                interval === value && "bg-brand-orange text-white hover:bg-brand-deep hover:text-white"
              )}
              onClick={() => setInterval(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-10">
        <PlanCards interval={interval} displayPlans={content.pricing} />
      </div>
    </section>
  );
}
