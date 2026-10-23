import { describe, expect, it } from "vitest";
import {
  ANNUAL_MONTHS_MULTIPLIER,
  annualPriceThb,
  planAmountThb,
  PLANS,
} from "./plans";

describe("plan constants", () => {
  it("uses annual = 10× monthly", () => {
    expect(ANNUAL_MONTHS_MULTIPLIER).toBe(10);
    expect(annualPriceThb(399)).toBe(3990);
    expect(planAmountThb("wdt199", "monthly")).toBe(199);
    expect(planAmountThb("wdt199", "annual")).toBe(1990);
    expect(planAmountThb("wdt399", "annual")).toBe(3990);
    expect(planAmountThb("wdt999", "annual")).toBe(9990);
  });

  it("exposes the three Soft Launch plans", () => {
    expect(Object.keys(PLANS).sort()).toEqual(["wdt199", "wdt399", "wdt999"]);
  });
});
