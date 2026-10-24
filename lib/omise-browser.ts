/** Omise.js helpers for the browser (card token only — never send PAN to our API). */

export type OmiseTokenSuccess = {
  id: string;
  card?: { last_digits?: string; brand?: string };
};

declare global {
  interface Window {
    Omise?: {
      setPublicKey: (key: string) => void;
      createToken: (
        type: "card",
        data: Record<string, string>,
        callback: (status: number, response: OmiseTokenSuccess & { message?: string }) => void
      ) => void;
    };
    OmiseCard?: {
      configure: (opts: Record<string, unknown>) => void;
      open: (opts: Record<string, unknown>) => void;
    };
  }
}

const OMISE_JS = "https://cdn.omise.co/omise.js";

export function getPublicOmiseKey(): string | null {
  return process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY?.trim() || null;
}

export function loadOmiseJs(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Omise && window.OmiseCard) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${OMISE_JS}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Omise.js failed")));
      if (window.Omise) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = OMISE_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Omise.js failed to load"));
    document.head.appendChild(script);
  });
}

/**
 * Open Omise prebuilt card form; resolve with token id.
 */
export async function openOmiseCardToken(params: {
  publicKey: string;
  amountSatang: number;
  description: string;
}): Promise<OmiseTokenSuccess> {
  await loadOmiseJs();
  if (!window.OmiseCard) {
    throw new Error("OmiseCard unavailable");
  }

  return new Promise((resolve, reject) => {
    window.OmiseCard!.configure({
      publicKey: params.publicKey,
      currency: "THB",
      frameLabel: "WDT Guardians",
      submitLabel: "Pay",
      buttonLabel: "Pay",
    });
    window.OmiseCard!.open({
      amount: params.amountSatang,
      description: params.description,
      onCreateTokenSuccess: (nonce: string) => {
        resolve({ id: nonce });
      },
      onFormClosed: () => {
        reject(new Error("Payment form closed"));
      },
    });
  });
}
