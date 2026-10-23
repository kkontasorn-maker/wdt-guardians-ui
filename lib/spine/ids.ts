import { randomBytes } from "crypto";

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function newGuardianId(): string {
  const n = 100000 + Math.floor(Math.random() * 900000);
  return `WDTG-${n}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
