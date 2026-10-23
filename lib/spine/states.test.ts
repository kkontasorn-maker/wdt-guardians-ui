import { describe, expect, it } from "vitest";
import {
  canTransition,
  isTerminal,
  nextStatus,
  transition,
} from "./states";

describe("subscription state machine", () => {
  it("activates pending → active only with paymentConfirmed", () => {
    const denied = transition("pending", "payment_confirmed");
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.reason).toMatch(/paymentConfirmed/);
    }

    const deniedExplicit = transition("pending", "payment_confirmed", {
      paymentConfirmed: false,
    });
    expect(deniedExplicit.ok).toBe(false);

    const ok = transition("pending", "payment_confirmed", {
      paymentConfirmed: true,
    });
    expect(ok).toEqual({
      ok: true,
      from: "pending",
      to: "active",
      event: "payment_confirmed",
    });
  });

  it("follows past_due → grace → cancelled / recovery", () => {
    expect(nextStatus("active", "payment_failed")).toBe("past_due");
    expect(nextStatus("past_due", "enter_grace")).toBe("grace");
    expect(nextStatus("grace", "cancel")).toBe("cancelled");
    expect(nextStatus("past_due", "payment_recovered")).toBe("active");
    expect(nextStatus("grace", "payment_confirmed")).toBe("active");
  });

  it("rejects illegal edges", () => {
    expect(canTransition("cancelled", "payment_confirmed")).toBe(false);
    expect(canTransition("pending", "payment_failed")).toBe(false);
    const bad = transition("active", "abandon");
    expect(bad.ok).toBe(false);
  });

  it("marks cancelled as terminal", () => {
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("active")).toBe(false);
  });

  it("allows pending abandon to cancelled", () => {
    const r = transition("pending", "abandon");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.to).toBe("cancelled");
  });
});
