"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const SITE_CONTENT_KEY = "wdt-site-content";

export type TrustCardContent = {
  title: string;
  description: string;
};

export type PricingContent = {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  recommended: boolean;
};

export type FaqItemContent = {
  question: string;
  answer: string;
};

export type SiteContent = {
  hero: {
    headline: string;
    subhead: string;
    primaryButtonText: string;
    secondaryButtonText: string;
  };
  trustCards: TrustCardContent[];
  pricing: PricingContent[];
  faq: FaqItemContent[];
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    headline: "You don't need to be in every case — but you can help WDT reach the next one.",
    subhead:
      "Recurring Guardian support keeps Watchdog Thailand Foundation ready for verification, coordination, field response, and evidence follow-up — the unglamorous work that decides whether a stray-animal case in Chiang Mai moves or stalls.",
    primaryButtonText: "Become a Guardian",
    secondaryButtonText: "How it works",
  },
  trustCards: [
    {
      title: "Registered foundation",
      description:
        "Watchdog Thailand Foundation is a registered Thai foundation doing animal-welfare work from Chiang Mai.",
    },
    {
      title: "Secure payments",
      description: "Membership is billed as a recurring gift. This prototype never sends a real charge.",
    },
    {
      title: "Transparent renewal",
      description: "You see the next renewal date, pause when you need, and cancel without a phone tree.",
    },
    {
      title: "No case influence",
      description: "A Guardian gift funds capacity. It does not buy a say in which case WDT takes next.",
    },
  ],
  pricing: [
    { name: "WDT 199", monthlyPrice: 199, annualPrice: 1990, recommended: false },
    { name: "WDT 399", monthlyPrice: 399, annualPrice: 3990, recommended: true },
    { name: "WDT 999", monthlyPrice: 999, annualPrice: 9990, recommended: false },
  ],
  faq: [
    {
      question: "Can I tell WDT which case to take?",
      answer:
        "No. Guardian gifts fund the desk and the field team, not a named animal. That is deliberate: membership must not steer casework.",
    },
    {
      question: "Can I pause or cancel?",
      answer:
        "Yes, from the member portal. Pausing keeps your Guardian ID; canceling stops the next mock renewal. Nothing here is a real charge.",
    },
    {
      question: "Where does the money go?",
      answer:
        "Recurring support is for verification, coordination, field response, and evidence follow-up across Watchdog Thailand Foundation’s stray-animal work in Chiang Mai.",
    },
  ],
};

function asString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeSiteContent(raw: unknown): SiteContent {
  const data = raw && typeof raw === "object" ? (raw as Partial<SiteContent>) : {};
  const hero = data.hero ?? DEFAULT_SITE_CONTENT.hero;
  const trust = Array.isArray(data.trustCards) ? data.trustCards : DEFAULT_SITE_CONTENT.trustCards;
  const pricingRaw = Array.isArray(data.pricing) ? data.pricing : [];
  const faq = Array.isArray(data.faq) ? data.faq : DEFAULT_SITE_CONTENT.faq;

  const pricing = DEFAULT_SITE_CONTENT.pricing.map((fallback, i) => {
    const item = pricingRaw[i] ?? fallback;
    return {
      name: asString(item.name, fallback.name),
      monthlyPrice: asNumber(item.monthlyPrice, fallback.monthlyPrice),
      annualPrice: asNumber(item.annualPrice, fallback.annualPrice),
      recommended: Boolean(item.recommended),
    };
  });

  return {
    hero: {
      headline: asString(hero.headline, DEFAULT_SITE_CONTENT.hero.headline),
      subhead: asString(hero.subhead, DEFAULT_SITE_CONTENT.hero.subhead),
      primaryButtonText: asString(hero.primaryButtonText, DEFAULT_SITE_CONTENT.hero.primaryButtonText),
      secondaryButtonText: asString(
        hero.secondaryButtonText,
        DEFAULT_SITE_CONTENT.hero.secondaryButtonText
      ),
    },
    trustCards: trust.map((card, i) => ({
      title: asString(card?.title, DEFAULT_SITE_CONTENT.trustCards[i]?.title ?? "Trust card"),
      description: asString(card?.description, DEFAULT_SITE_CONTENT.trustCards[i]?.description ?? ""),
    })),
    pricing,
    faq: faq.map((item, i) => ({
      question: asString(item?.question, DEFAULT_SITE_CONTENT.faq[i]?.question ?? "Question"),
      answer: asString(item?.answer, DEFAULT_SITE_CONTENT.faq[i]?.answer ?? ""),
    })),
  };
}

type ContentContextValue = {
  content: SiteContent;
  saveContent: (next: SiteContent) => void;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SITE_CONTENT_KEY);
      if (raw) setContent(normalizeSiteContent(JSON.parse(raw)));
    } catch {
      setContent(DEFAULT_SITE_CONTENT);
    }
  }, []);

  const value = useMemo<ContentContextValue>(
    () => ({
      content,
      saveContent: (next) => {
        const normalized = normalizeSiteContent(next);
        setContent(normalized);
        window.localStorage.setItem(SITE_CONTENT_KEY, JSON.stringify(normalized));
      },
    }),
    [content]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useSiteContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    throw new Error("useSiteContent must be used within ContentProvider");
  }
  return ctx;
}
