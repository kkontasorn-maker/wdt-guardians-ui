/**
 * Omise Thailand Mobile Banking sources (deep-link into bank apps).
 * Each method must be enabled on the Omise merchant (test or live).
 */

export type MobileBankId =
  | "scb"
  | "kbank"
  | "bay"
  | "bbl"
  | "ktb";

export type MobileBank = {
  id: MobileBankId;
  /** Omise source[type] */
  sourceType: string;
  nameEn: string;
  nameTh: string;
  appHintEn: string;
};

export const MOBILE_BANKS: MobileBank[] = [
  {
    id: "scb",
    sourceType: "mobile_banking_scb",
    nameEn: "SCB Easy",
    nameTh: "SCB Easy",
    appHintEn: "Siam Commercial Bank",
  },
  {
    id: "kbank",
    sourceType: "mobile_banking_kbank",
    nameEn: "K PLUS",
    nameTh: "K PLUS",
    appHintEn: "Kasikornbank",
  },
  {
    id: "bay",
    sourceType: "mobile_banking_bay",
    nameEn: "KMA",
    nameTh: "KMA",
    appHintEn: "Krungsri",
  },
  {
    id: "bbl",
    sourceType: "mobile_banking_bbl",
    nameEn: "Bualuang mBanking",
    nameTh: "Bualuang mBanking",
    appHintEn: "Bangkok Bank",
  },
  {
    id: "ktb",
    sourceType: "mobile_banking_ktb",
    nameEn: "Krungthai NEXT",
    nameTh: "Krungthai NEXT",
    appHintEn: "Krungthai Bank",
  },
];

export function mobileBankById(id: string | null | undefined): MobileBank | null {
  if (!id) return null;
  return MOBILE_BANKS.find((b) => b.id === id) ?? null;
}

export function isMobileBankId(id: string): id is MobileBankId {
  return MOBILE_BANKS.some((b) => b.id === id);
}
