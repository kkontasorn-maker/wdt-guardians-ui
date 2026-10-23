/**
 * Shared Soft Launch plan constants.
 * Annual = 10× monthly (two months free). Keep in sync with UI copy in lib/membership.ts.
 */

export const PLAN_IDS = ["wdt199", "wdt399", "wdt999"] as const;
export type SpinePlanId = (typeof PLAN_IDS)[number];

export type BillingInterval = "monthly" | "annual";

export type PlanDefinition = {
  id: SpinePlanId;
  name: string;
  monthlyThb: number;
};

/** Canonical plan table as constants (not a DB table for Soft Launch). */
export const PLANS: Record<SpinePlanId, PlanDefinition> = {
  wdt199: { id: "wdt199", name: "WDT 199", monthlyThb: 199 },
  wdt399: { id: "wdt399", name: "WDT 399", monthlyThb: 399 },
  wdt999: { id: "wdt999", name: "WDT 999", monthlyThb: 999 },
};

export const ANNUAL_MONTHS_MULTIPLIER = 10;

export function isSpinePlanId(value: string): value is SpinePlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

export function annualPriceThb(monthlyThb: number): number {
  return monthlyThb * ANNUAL_MONTHS_MULTIPLIER;
}

export function periodAmountThb(monthlyThb: number, interval: BillingInterval): number {
  return interval === "annual" ? annualPriceThb(monthlyThb) : monthlyThb;
}

export function planAmountThb(planId: SpinePlanId, interval: BillingInterval): number {
  return periodAmountThb(PLANS[planId].monthlyThb, interval);
}
