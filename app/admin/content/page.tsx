// This uses localStorage as a stand-in for a real content API — in production this should read/write to a database so content changes are shared across devices and persist server-side.
"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_SITE_CONTENT,
  useSiteContent,
  type SiteContent,
} from "@/lib/contentContext";

export default function AdminContentPage() {
  const { content, saveContent } = useSiteContent();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  function save() {
    saveContent(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function preview() {
    window.open("/", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Website Content</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit landing-page copy. Join still uses the membership catalog IDs, not these display names.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={preview}>
            <ExternalLink />
            Preview site
          </Button>
          <Button type="button" size="lg" onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
      {saved && (
        <p className="mt-3 text-sm font-medium text-emerald-700" role="status">
          Saved
        </p>
      )}

      <Accordion type="multiple" defaultValue={["hero", "trust", "pricing", "faq"]} className="mt-6">
        <AccordionItem value="hero">
          <AccordionTrigger className="font-heading text-base font-extrabold">Hero</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <Field label="Headline">
              <Textarea
                value={draft.hero.headline}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, hero: { ...d.hero, headline: e.target.value } }))
                }
                rows={3}
              />
            </Field>
            <Field label="Subhead">
              <Textarea
                value={draft.hero.subhead}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, hero: { ...d.hero, subhead: e.target.value } }))
                }
                rows={4}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primary button">
                <Input
                  value={draft.hero.primaryButtonText}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      hero: { ...d.hero, primaryButtonText: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Secondary button">
                <Input
                  value={draft.hero.secondaryButtonText}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      hero: { ...d.hero, secondaryButtonText: e.target.value },
                    }))
                  }
                />
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="trust">
          <AccordionTrigger className="font-heading text-base font-extrabold">
            Trust Cards
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            {draft.trustCards.map((card, i) => (
              <div key={i} className="rounded-lg border border-border bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Card {i + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        trustCards: d.trustCards.filter((_, idx) => idx !== i),
                      }))
                    }
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
                <Field label="Title">
                  <Input
                    value={card.title}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        trustCards: d.trustCards.map((item, idx) =>
                          idx === i ? { ...item, title: e.target.value } : item
                        ),
                      }))
                    }
                  />
                </Field>
                <div className="mt-3">
                  <Field label="Description">
                    <Textarea
                      value={card.description}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          trustCards: d.trustCards.map((item, idx) =>
                            idx === i ? { ...item, description: e.target.value } : item
                          ),
                        }))
                      }
                      rows={3}
                    />
                  </Field>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  trustCards: [...d.trustCards, { title: "", description: "" }],
                }))
              }
            >
              <Plus />
              Add trust card
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pricing">
          <AccordionTrigger className="font-heading text-base font-extrabold">Pricing</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Display copy only. Choose this plan still opens /join with wdt199 / wdt399 / wdt999 in this order.
            </p>
            {draft.pricing.map((plan, i) => (
              <div key={i} className="rounded-lg border border-border bg-white p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Plan {i + 1}
                </p>
                <Field label="Name">
                  <Input
                    value={plan.name}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        pricing: d.pricing.map((item, idx) =>
                          idx === i ? { ...item, name: e.target.value } : item
                        ),
                      }))
                    }
                  />
                </Field>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Monthly price (THB)">
                    <Input
                      type="number"
                      min={0}
                      value={plan.monthlyPrice}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          pricing: d.pricing.map((item, idx) =>
                            idx === i ? { ...item, monthlyPrice: Number(e.target.value) || 0 } : item
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Annual price (THB)">
                    <Input
                      type="number"
                      min={0}
                      value={plan.annualPrice}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          pricing: d.pricing.map((item, idx) =>
                            idx === i ? { ...item, annualPrice: Number(e.target.value) || 0 } : item
                          ),
                        }))
                      }
                    />
                  </Field>
                </div>
                <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    checked={plan.recommended}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        pricing: d.pricing.map((item, idx) =>
                          idx === i ? { ...item, recommended: Boolean(v) } : item
                        ),
                      }))
                    }
                  />
                  Recommended
                </label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq">
          <AccordionTrigger className="font-heading text-base font-extrabold">FAQ</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {draft.faq.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Item {i + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDraft((d) => ({ ...d, faq: d.faq.filter((_, idx) => idx !== i) }))
                    }
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
                <Field label="Question">
                  <Input
                    value={item.question}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        faq: d.faq.map((faq, idx) =>
                          idx === i ? { ...faq, question: e.target.value } : faq
                        ),
                      }))
                    }
                  />
                </Field>
                <div className="mt-3">
                  <Field label="Answer">
                    <Textarea
                      value={item.answer}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          faq: d.faq.map((faq, idx) =>
                            idx === i ? { ...faq, answer: e.target.value } : faq
                          ),
                        }))
                      }
                      rows={3}
                    />
                  </Field>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  faq: [...d.faq, { question: "", answer: "" }],
                }))
              }
            >
              <Plus />
              Add FAQ
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-brand-paper/95 px-4 py-3 lg:left-60">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3">
          {saved && (
            <p className="mr-auto text-sm font-medium text-emerald-700" role="status">
              Saved
            </p>
          )}
          <Button type="button" variant="outline" onClick={() => setDraft(DEFAULT_SITE_CONTENT)}>
            Reset draft
          </Button>
          <Button type="button" size="lg" onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
