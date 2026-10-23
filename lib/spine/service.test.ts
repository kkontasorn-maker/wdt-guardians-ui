import { beforeEach, describe, expect, it } from "vitest";
import {
  createPendingMembership,
  getMemberByGuardianId,
  handleOmiseChargeComplete,
} from "./service";
import { resetStoreCache } from "./store";

describe("membership service", () => {
  beforeEach(() => {
    resetStoreCache();
    delete process.env.DATABASE_URL;
  });

  it("creates pending membership without activating", async () => {
    const result = await createPendingMembership({
      email: "guardian@example.org",
      firstName: "Niran",
      lastName: "Srisawat",
      planId: "wdt399",
      interval: "monthly",
      locale: "en",
      founding: true,
    });

    expect(result.subscription.status).toBe("pending");
    expect(result.subscription.activatedAt).toBeNull();
    expect(result.subscription.amountThb).toBe(399);
    expect(result.member.founding).toBe(true);
    expect(result.member.guardianId).toMatch(/^WDTG-\d{6}$/);

    const loaded = await getMemberByGuardianId(result.member.guardianId);
    expect(loaded?.subscription?.status).toBe("pending");
  });

  it("activates only after confirmed charge webhook", async () => {
    const pending = await createPendingMembership({
      email: "pay@example.org",
      firstName: "Mali",
      lastName: "Thong",
      planId: "wdt199",
      interval: "annual",
    });
    expect(pending.subscription.amountThb).toBe(1990);

    const first = await handleOmiseChargeComplete({
      gatewayEventId: "evnt_test_1",
      gatewayChargeId: "chrg_test_1",
      subscriptionId: pending.subscription.id,
    });
    expect(first.status).toBe("activated");

    const loaded = await getMemberByGuardianId(pending.member.guardianId);
    expect(loaded?.subscription?.status).toBe("active");
    expect(loaded?.subscription?.activatedAt).toBeTruthy();

    const dup = await handleOmiseChargeComplete({
      gatewayEventId: "evnt_test_1",
      gatewayChargeId: "chrg_test_1",
      subscriptionId: pending.subscription.id,
    });
    expect(dup.status).toBe("duplicate");
  });
});
