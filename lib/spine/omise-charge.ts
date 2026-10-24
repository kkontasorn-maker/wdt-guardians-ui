import { getOmiseConfig } from "./omise";

export type CreateChargeInput = {
  token: string;
  amountSatang: number;
  currency?: "thb";
  description: string;
  metadata?: Record<string, string>;
};

export type CreateChargeResult =
  | {
      ok: true;
      chargeId: string;
      status: string;
      paid: boolean;
    }
  | { ok: false; error: string; skipped?: boolean };

/**
 * Create an Omise charge from a browser token. Never accepts raw card PAN.
 * Missing secret key → safe skip.
 */
export async function createOmiseCharge(
  input: CreateChargeInput
): Promise<CreateChargeResult> {
  const config = getOmiseConfig();
  if (!config.secretKey) {
    return {
      ok: false,
      skipped: true,
      error: "OMISE_SECRET_KEY not configured",
    };
  }

  const body = new URLSearchParams();
  body.set("amount", String(input.amountSatang));
  body.set("currency", input.currency ?? "thb");
  body.set("card", input.token);
  body.set("description", input.description);
  if (input.metadata) {
    for (const [k, v] of Object.entries(input.metadata)) {
      body.set(`metadata[${k}]`, v);
    }
  }

  const auth = Buffer.from(`${config.secretKey}:`).toString("base64");
  const res = await fetch("https://api.omise.co/charges", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    paid?: boolean;
    message?: string;
    failure_message?: string;
  };

  if (!res.ok || !data.id) {
    return {
      ok: false,
      error: data.failure_message || data.message || `Omise charge failed (${res.status})`,
    };
  }

  return {
    ok: true,
    chargeId: data.id,
    status: data.status ?? "unknown",
    paid: Boolean(data.paid) || data.status === "successful",
  };
}

export function thbToSatang(thb: number): number {
  return Math.round(thb * 100);
}
