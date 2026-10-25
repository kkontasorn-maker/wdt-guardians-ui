import { describe, expect, it } from "vitest";
import {
  generateTempPassword,
  hashPassword,
  verifyPassword,
} from "@/lib/admin-password";

describe("admin-password", () => {
  it("hashes and verifies", () => {
    const hash = hashPassword("SoftLaunch!9");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(verifyPassword("SoftLaunch!9", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("generates usable temp passwords", () => {
    const a = generateTempPassword();
    const b = generateTempPassword();
    expect(a.length).toBeGreaterThanOrEqual(12);
    expect(a).not.toBe(b);
  });
});
