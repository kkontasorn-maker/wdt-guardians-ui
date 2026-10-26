"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";

export const TERMS_CONTENT_KEY = "wdt-terms-content";

export type TermsLocaleContent = {
  title: string;
  /** Plain text; blank lines become paragraphs on /terms. */
  body: string;
  updatedLabel: string;
};

export type TermsContent = {
  en: TermsLocaleContent;
  th: TermsLocaleContent;
};

export const DEFAULT_TERMS_CONTENT: TermsContent = {
  en: {
    title: "WDT Guardians Soft Launch Terms",
    updatedLabel: "Soft Launch stub — officers may update this text in Admin → Content.",
    body: [
      "These Soft Launch terms apply to the WDT Guardians membership program operated by Watchdog Thailand Foundation (Chiang Mai).",
      "By joining, you agree to pay the amount due for the membership period you select (monthly or annual). Soft Launch does not set up automatic renewals or auto-debit for later periods yet. Later periods, if offered, will require a new payment or a separate Phase 2 renewal flow.",
      "Card payments are processed by Omise. Card numbers are entered in Omise’s secure form and are never stored on WDT servers. PromptPay payments use a one-time QR for the amount due today.",
      "Guardian gifts fund verification, coordination, field response, and evidence follow-up capacity. A gift does not buy influence over which case WDT takes next.",
      "You may pause or cancel from the member portal when available. Soft Launch is a limited production path for invite / controlled use.",
      "Contact the Chiang Mai desk via the channels published on the Guardians site if you need help with your membership.",
    ].join("\n\n"),
  },
  th: {
    title: "เงื่อนไข Soft Launch กาเดียน WDT",
    updatedLabel: "ข้อความชั่วคราว Soft Launch — เจ้าหน้าที่แก้ไขได้ที่ Admin → Content",
    body: [
      "เงื่อนไข Soft Launch นี้ใช้กับโปรแกรมสมาชิก WDT Guardians ของมูลนิธิวอทช์ด็อกประเทศไทย (เชียงใหม่)",
      "การสมัครถือว่าคุณตกลงชำระยอดที่ต้องจ่ายสำหรับรอบสมาชิกที่เลือก (รายเดือนหรือรายปี) Soft Launch ยังไม่ตั้งการต่ออายุอัตโนมัติหรือตัดรอบถัดไปอัตโนมัติ รอบถัดไป (ถ้ามี) ต้องชำระใหม่ หรือใช้ระบบต่ออายุในเฟส 2",
      "การชำระด้วยบัตรผ่าน Omise กรอกเลขบัตรในแบบฟอร์มปลอดภัยของ Omise และไม่เก็บบนเซิร์ฟเวอร์ WDT พร้อมเพย์ใช้ QR ครั้งเดียวสำหรับยอดที่ต้องจ่ายวันนี้",
      "ของขวัญกาเดียนสนับสนุนงานตรวจสอบ ประสานงาน ลงพื้นที่ และหลักฐาน ไม่ได้ซื้อสิทธิ์ชี้นำว่า WDT จะรับเคสใดต่อไป",
      "หยุดหรือยกเลิกได้จากหน้าสมาชิกเมื่อพร้อม Soft Launch เป็นเส้นทางใช้งานจำกัดสำหรับเชิญ / ควบคุม",
      "ติดต่อโต๊ะเชียงใหม่ผ่านช่องทางบนเว็บไซต์กาเดียนหากต้องการความช่วยเหลือเรื่องสมาชิกภาพ",
    ].join("\n\n"),
  },
};

function asString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function normalizeLocale(
  raw: unknown,
  fallback: TermsLocaleContent
): TermsLocaleContent {
  const data = raw && typeof raw === "object" ? (raw as Partial<TermsLocaleContent>) : {};
  return {
    title: asString(data.title, fallback.title),
    body: asString(data.body, fallback.body),
    updatedLabel: asString(data.updatedLabel, fallback.updatedLabel),
  };
}

export function normalizeTermsContent(raw: unknown): TermsContent {
  const data = raw && typeof raw === "object" ? (raw as Partial<TermsContent>) : {};
  return {
    en: normalizeLocale(data.en, DEFAULT_TERMS_CONTENT.en),
    th: normalizeLocale(data.th, DEFAULT_TERMS_CONTENT.th),
  };
}

export function termsForLocale(content: TermsContent, locale: Locale): TermsLocaleContent {
  return locale === "th" ? content.th : content.en;
}

export function termsBodyParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type TermsContextValue = {
  content: TermsContent;
  saveContent: (next: TermsContent) => void;
};

const TermsContext = createContext<TermsContextValue | null>(null);

export function TermsProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<TermsContent>(DEFAULT_TERMS_CONTENT);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TERMS_CONTENT_KEY);
      if (raw) setContent(normalizeTermsContent(JSON.parse(raw)));
    } catch {
      setContent(DEFAULT_TERMS_CONTENT);
    }
  }, []);

  const value = useMemo<TermsContextValue>(
    () => ({
      content,
      saveContent: (next) => {
        const normalized = normalizeTermsContent(next);
        setContent(normalized);
        window.localStorage.setItem(TERMS_CONTENT_KEY, JSON.stringify(normalized));
      },
    }),
    [content]
  );

  return <TermsContext.Provider value={value}>{children}</TermsContext.Provider>;
}

export function useTermsContent() {
  const ctx = useContext(TermsContext);
  if (!ctx) {
    throw new Error("useTermsContent must be used within TermsProvider");
  }
  return ctx;
}
