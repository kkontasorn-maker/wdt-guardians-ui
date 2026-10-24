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

export type PromptPayChargeResult =
  | {
      ok: true;
      chargeId: string;
      status: string;
      paid: boolean;
      qrImageUrl: string | null;
      expiresAt: string | null;
    }
  | { ok: false; error: string; skipped?: boolean };

export type ChargeStatusResult =
  | {
      ok: true;
      chargeId: string;
      status: string;
      paid: boolean;
      qrImageUrl: string | null;
    }
  | { ok: false; error: string; skipped?: boolean };

export type MobileBankingChargeResult =
  | {
      ok: true;
      chargeId: string;
      status: string;
      paid: boolean;
      authorizeUri: string;
    }
  | { ok: false; error: string; skipped?: boolean };

function omiseAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

function qrFromCharge(data: {
  source?: {
    scannable_code?: {
      image?: { download_uri?: string };
    };
  };
}): string | null {
  return data.source?.scannable_code?.image?.download_uri ?? null;
}

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

  const res = await fetch("https://api.omise.co/charges", {
    method: "POST",
    headers: {
      Authorization: omiseAuthHeader(config.secretKey),
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

/**
 * Create a PromptPay QR charge. Activation must wait for webhook / poll of paid status.
 */
export async function createOmisePromptPayCharge(input: {
  amountSatang: number;
  description: string;
  metadata?: Record<string, string>;
}): Promise<PromptPayChargeResult> {
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
  body.set("currency", "thb");
  body.set("source[type]", "promptpay");
  body.set("description", input.description);
  if (input.metadata) {
    for (const [k, v] of Object.entries(input.metadata)) {
      body.set(`metadata[${k}]`, v);
    }
  }

  const res = await fetch("https://api.omise.co/charges", {
    method: "POST",
    headers: {
      Authorization: omiseAuthHeader(config.secretKey),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    paid?: boolean;
    expires_at?: string;
    message?: string;
    failure_message?: string;
    source?: {
      scannable_code?: {
        image?: { download_uri?: string };
      };
    };
  };

  if (!res.ok || !data.id) {
    return {
      ok: false,
      error:
        data.failure_message ||
        data.message ||
        `Omise PromptPay charge failed (${res.status})`,
    };
  }

  return {
    ok: true,
    chargeId: data.id,
    status: data.status ?? "pending",
    paid: Boolean(data.paid) || data.status === "successful",
    qrImageUrl: qrFromCharge(data),
    expiresAt: data.expires_at ?? null,
  };
}

/**
 * Create a Mobile Banking charge and return authorize_uri (deep link into bank app).
 * Caller must redirect the browser to authorizeUri, then poll / webhook for paid.
 */
export async function createOmiseMobileBankingCharge(input: {
  sourceType: string;
  amountSatang: number;
  returnUri: string;
  description: string;
  metadata?: Record<string, string>;
}): Promise<MobileBankingChargeResult> {
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
  body.set("currency", "thb");
  body.set("source[type]", input.sourceType);
  body.set("return_uri", input.returnUri);
  body.set("description", input.description);
  if (input.metadata) {
    for (const [k, v] of Object.entries(input.metadata)) {
      body.set(`metadata[${k}]`, v);
    }
  }

  const res = await fetch("https://api.omise.co/charges", {
    method: "POST",
    headers: {
      Authorization: omiseAuthHeader(config.secretKey),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    paid?: boolean;
    authorize_uri?: string;
    message?: string;
    failure_message?: string;
  };

  if (!res.ok || !data.id) {
    return {
      ok: false,
      error:
        data.failure_message ||
        data.message ||
        `Omise Mobile Banking charge failed (${res.status})`,
    };
  }

  if (!data.authorize_uri && !(Boolean(data.paid) || data.status === "successful")) {
    return {
      ok: false,
      error:
        data.failure_message ||
        data.message ||
        "Omise did not return authorize_uri — enable this bank on your Omise account (support@omise.co).",
    };
  }

  return {
    ok: true,
    chargeId: data.id,
    status: data.status ?? "pending",
    paid: Boolean(data.paid) || data.status === "successful",
    authorizeUri: data.authorize_uri ?? input.returnUri,
  };
}

export async function getOmiseChargeStatus(
  chargeId: string
): Promise<ChargeStatusResult> {
  const config = getOmiseConfig();
  if (!config.secretKey) {
    return {
      ok: false,
      skipped: true,
      error: "OMISE_SECRET_KEY not configured",
    };
  }

  const res = await fetch(`https://api.omise.co/charges/${encodeURIComponent(chargeId)}`, {
    headers: {
      Authorization: omiseAuthHeader(config.secretKey),
    },
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    paid?: boolean;
    message?: string;
    source?: {
      scannable_code?: {
        image?: { download_uri?: string };
      };
    };
  };

  if (!res.ok || !data.id) {
    return {
      ok: false,
      error: data.message || `Omise charge lookup failed (${res.status})`,
    };
  }

  return {
    ok: true,
    chargeId: data.id,
    status: data.status ?? "unknown",
    paid: Boolean(data.paid) || data.status === "successful",
    qrImageUrl: qrFromCharge(data),
  };
}

export function thbToSatang(thb: number): number {
  return Math.round(thb * 100);
}
