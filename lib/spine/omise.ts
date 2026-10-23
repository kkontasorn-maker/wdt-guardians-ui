/**
 * Omise (Opn) helpers — no real secrets. Missing keys → safe no-op.
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

/**
 * Signature verification placeholder.
 * When OMISE_WEBHOOK_SECRET is unset, returns { ok: true, skipped: true }.
 * When set, currently accepts any non-empty signature header (real HMAC TBD).
 */
export function verifyOmiseWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
}): { ok: boolean; skipped: boolean; reason?: string } {
  const secret = process.env.OMISE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return { ok: true, skipped: true, reason: "OMISE_WEBHOOK_SECRET not set" };
  }
  if (!params.signatureHeader) {
    return { ok: false, skipped: false, reason: "missing signature header" };
  }
  // Placeholder: real Omise HMAC verification lands with live keys.
  void params.rawBody;
  return { ok: true, skipped: false };
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
