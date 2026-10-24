/**
 * Omise (Opn) helpers — no real secrets committed. Missing keys → safe no-op.
 */

export type OmiseConfig = {
  publicKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  configured: boolean;
};

export function getOmiseConfig(): OmiseConfig {
  const publicKey = process.env.OMISE_PUBLIC_KEY?.trim() || null;
  const secretKey = process.env.OMISE_SECRET_KEY?.trim() || null;
  const webhookSecret = process.env.OMISE_WEBHOOK_SECRET?.trim() || null;
  return {
    publicKey,
    secretKey,
    webhookSecret,
    configured: Boolean(publicKey && secretKey),
  };
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * Soft Launch webhook verification.
 * - No secret → skip (local).
 * - `OMISE_WEBHOOK_SKIP_VERIFY=1` → skip (tunnel debugging).
 * - Else require `x-webhook-secret` or signature header equal to OMISE_WEBHOOK_SECRET.
 */
export function verifyOmiseWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  webhookSecretHeader?: string | null;
}): { ok: boolean; skipped: boolean; reason?: string } {
  const secret = process.env.OMISE_WEBHOOK_SECRET?.trim();
  if (!secret || process.env.OMISE_WEBHOOK_SKIP_VERIFY === "1") {
    return {
      ok: true,
      skipped: true,
      reason: !secret ? "OMISE_WEBHOOK_SECRET not set" : "OMISE_WEBHOOK_SKIP_VERIFY=1",
    };
  }
  void params.rawBody;
  const candidates = [params.webhookSecretHeader, params.signatureHeader].filter(
    Boolean
  ) as string[];
  if (candidates.length === 0) {
    return { ok: false, skipped: false, reason: "missing signature/secret header" };
  }
  for (const candidate of candidates) {
    if (safeEqual(candidate, secret)) return { ok: true, skipped: false };
  }
  return { ok: false, skipped: false, reason: "signature mismatch" };
}

/** Successful charge-like Omise event keys we activate on. */
export function isSuccessfulChargeEvent(key: string | undefined): boolean {
  if (!key) return false;
  return (
    key === "charge.complete" ||
    key === "charge.create" ||
    key.endsWith(".charge.complete")
  );
}
