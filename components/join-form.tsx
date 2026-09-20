"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CreditCard, Loader2, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useMembership } from "@/lib/hooks";
import {
  addInterval,
  annualPrice,
  formatMoney,
  generateMemberId,
  generateReceiptId,
  PAYMENT_METHODS,
  periodAmount,
  planById,
  PLANS,
  type BillingInterval,
  type NamedPlanId,
  type PaymentMethod,
} from "@/lib/membership";
import { cn } from "@/lib/utils";

const STEPS = ["Choose plan", "Guardian details", "Payment"] as const;
const STEP_SHORT = ["Plan", "Details", "Pay"] as const;

function isNamedPlanId(value: string | null): value is NamedPlanId {
  return value === "wdt199" || value === "wdt399" || value === "wdt999";
}

function paymentBrand(method: PaymentMethod) {
  if (method === "bank") return "Bank debit";
  if (method === "promptpay") return "PromptPay";
  return "Card";
}

function OrderSummary({
  planId,
  interval,
}: {
  planId: NamedPlanId;
  interval: BillingInterval;
}) {
  const plan = planById(planId);
  const charge = periodAmount(plan.monthly, interval);

  return (
    <aside className="h-fit rounded-2xl border border-border/80 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">Summary</p>
      <h2 className="mt-2 text-xl font-extrabold">{plan.name}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{plan.blurb}</p>
      <Separator className="my-5" />
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Billing</dt>
          <dd className="font-medium capitalize">{interval}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Monthly</dt>
          <dd className="font-medium">{formatMoney(plan.monthly)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Annual</dt>
          <dd className="font-medium">{formatMoney(annualPrice(plan.monthly))}</dd>
        </div>
      </dl>
      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">Due today</p>
        <p className="font-heading text-2xl font-extrabold text-brand-ink sm:text-3xl">{formatMoney(charge)}</p>
      </div>
    </aside>
  );
}

export function JoinForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { save } = useMembership();

  const [step, setStep] = useState(0);
  const [planId, setPlanId] = useState<NamedPlanId | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [authorizeBilling, setAuthorizeBilling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fromQuery = searchParams.get("plan");
    if (isNamedPlanId(fromQuery)) setPlanId(fromQuery);
    const intervalQuery = searchParams.get("interval");
    if (intervalQuery === "monthly" || intervalQuery === "annual") {
      setInterval(intervalQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  const charge = useMemo(() => {
    if (!planId) return 0;
    return periodAmount(planById(planId).monthly, interval);
  }, [planId, interval]);

  function validateDetails() {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "First name is required.";
    if (!lastName.trim()) next.lastName = "Last name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email.";
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 10) {
      next.phone = "Enter a valid phone number.";
    }
    if (!acceptTerms) next.acceptTerms = "Accept the terms to continue.";
    if (!authorizeBilling) next.authorizeBilling = "Authorize recurring billing to continue.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (step === 0 && !planId) return;
    if (step === 1 && !validateDetails()) return;
    setStep((s) => Math.min(s + 1, 2));
  }

  async function confirmMembership() {
    if (!planId || !paymentMethod) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));

    const now = new Date().toISOString();
    const plan = planById(planId);
    save({
      memberId: generateMemberId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\s/g, ""),
      zip: "",
      planId,
      amount: plan.monthly,
      interval,
      status: "active",
      joinedAt: now,
      nextBillingAt: addInterval(now, interval),
      pausedAt: null,
      canceledAt: null,
      lastFour: paymentMethod === "card" ? "4242" : "",
      cardBrand: paymentBrand(paymentMethod),
      paymentMethod,
      dedication: "",
      receipts: [
        {
          id: generateReceiptId(),
          date: now,
          amount: charge,
          interval,
          status: "paid",
        },
      ],
    });
    router.push("/join/success");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-32 pt-8 sm:px-6 sm:pb-16 sm:pt-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">Join</p>
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Become a Guardian.</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Recurring support in Thai baht. Pause or cancel any time from the member portal.
      </p>

      <div className="mt-10">
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={cn(
                "flex min-h-11 items-center justify-center rounded-xl border px-2 py-2 text-center text-xs font-medium sm:justify-start sm:px-3 sm:text-left sm:text-sm",
                i === step
                  ? "border-brand-orange bg-white text-brand-ink"
                  : i < step
                    ? "border-brand-orange/40 bg-accent text-brand-deep"
                    : "border-border bg-white/70 text-muted-foreground"
              )}
            >
              <span className="font-heading font-extrabold text-brand-orange">{i + 1}</span>
              <span className="ml-1.5 truncate sm:ml-2">
                <span className="sm:hidden">{STEP_SHORT[i]}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            </li>
          ))}
        </ol>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-4 h-1.5" />
      </div>

      <div className="mt-10">
        {step === 0 && (
          <div>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-extrabold">Choose your plan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Annual giving includes two months free. Select a plan to continue.
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-1 rounded-full border border-border bg-white p-1 sm:inline-flex sm:w-auto">
                {(["monthly", "annual"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-11 min-h-11 rounded-full capitalize",
                      interval === value && "bg-brand-orange text-white hover:bg-brand-deep hover:text-white"
                    )}
                    onClick={() => setInterval(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 md:grid-cols-3">
              {PLANS.map((plan) => {
                const selected = planId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setPlanId(plan.id)}
                    className="w-full min-w-0 text-left"
                  >
                    <Card
                      className={cn(
                        "h-full rounded-2xl border-border/80 bg-white shadow-sm transition",
                        plan.popular && !selected && "ring-2 ring-brand-orange/40",
                        selected && "border-brand-orange ring-2 ring-brand-orange"
                      )}
                    >
                      <CardHeader className="space-y-3 p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <CardTitle className="font-heading text-2xl">{plan.name}</CardTitle>
                          {plan.popular && (
                            <Badge className="bg-brand-orange hover:bg-brand-deep">Recommended</Badge>
                          )}
                        </div>
                        <CardDescription>{plan.blurb}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <p className="font-heading text-3xl font-extrabold text-brand-ink">
                          {formatMoney(plan.monthly)}
                          <span className="ml-1 text-base font-medium text-muted-foreground">/month</span>
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatMoney(annualPrice(plan.monthly))} / year
                        </p>
                        {selected && (
                          <p className="mt-4 text-sm font-medium text-brand-deep">
                            Selected · billed {interval}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && planId && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-2xl font-extrabold">Guardian details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We use this to send your receipt and membership notes.
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    className="mt-2 h-12"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-2 text-sm text-destructive">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    className="mt-2 h-12"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-2 text-sm text-destructive">{fieldErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    className="mt-2 h-12"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  {fieldErrors.email && (
                    <p className="mt-2 text-sm text-destructive">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    className="mt-2 h-12"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="081 234 5678"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-2 text-sm text-destructive">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-1 py-2 text-sm">
                  <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(Boolean(v))} />
                  <span>Accept terms</span>
                </label>
                {fieldErrors.acceptTerms && (
                  <p className="text-sm text-destructive">{fieldErrors.acceptTerms}</p>
                )}
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-1 py-2 text-sm">
                  <Checkbox
                    checked={authorizeBilling}
                    onCheckedChange={(v) => setAuthorizeBilling(Boolean(v))}
                  />
                  <span>Authorize recurring billing</span>
                </label>
                {fieldErrors.authorizeBilling && (
                  <p className="text-sm text-destructive">{fieldErrors.authorizeBilling}</p>
                )}
              </div>
            </div>
            <OrderSummary planId={planId} interval={interval} />
          </div>
        )}

        {step === 2 && planId && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-2xl font-extrabold">Payment</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how you would like each renewal to be collected.
              </p>
              <div className="mt-6 grid gap-4">
                {PAYMENT_METHODS.map((method) => {
                  const selected = paymentMethod === method.id;
                  const Icon =
                    method.id === "card" ? CreditCard : method.id === "bank" ? Building2 : QrCode;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        "flex min-h-[4.5rem] items-center gap-4 rounded-2xl border bg-white p-5 text-left transition",
                        selected
                          ? "border-brand-orange ring-2 ring-brand-orange"
                          : "border-border/80 hover:border-brand-orange/50"
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-brand-deep">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-heading text-lg font-extrabold">{method.name}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {method.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <OrderSummary planId={planId} interval={interval} />
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-brand-paper/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:static sm:z-auto sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="h-12 min-h-12 min-w-[5.75rem] shrink-0 px-4 sm:w-auto"
            disabled={step === 0 || submitting}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {step < 2 ? (
            <Button
              type="button"
              size="lg"
              className="min-w-0 flex-1 sm:w-auto sm:flex-none"
              onClick={goNext}
              disabled={(step === 0 && !planId) || (step === 1 && (!acceptTerms || !authorizeBilling))}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="min-w-0 flex-1 sm:w-auto sm:flex-none"
              onClick={confirmMembership}
              disabled={submitting || !paymentMethod}
            >
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? "Confirming…" : "Confirm membership"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
