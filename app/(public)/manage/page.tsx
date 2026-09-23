"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CreditCard, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMembership } from "@/lib/hooks";
import { formatDateForLocale, formatMoneyForLocale, paymentBrandLabel, planCopy } from "@/lib/i18n";
import { useLocale } from "@/lib/localeContext";
import {
  addInterval,
  generateReceiptId,
  impactFromMembership,
  periodAmount,
  PLANS,
  sampleMembership,
  type Membership,
  type PlanId,
} from "@/lib/membership";

function statusBadge(status: Membership["status"], t: (key: string) => string) {
  if (status === "active") return <Badge className="bg-brand-orange hover:bg-brand-deep">{t("status.active")}</Badge>;
  if (status === "paused")
    return (
      <Badge variant="outline" className="border-brand-slate text-brand-slate">
        {t("status.paused")}
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-destructive">
      {t("status.canceled")}
    </Badge>
  );
}

export default function ManagePage() {
  const { membership, state, save, clear } = useMembership();
  const { locale, t } = useLocale();
  const [planDraft, setPlanDraft] = useState<PlanId>("wdt399");
  const [cardDraft, setCardDraft] = useState("");
  const [cardOpen, setCardOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (state === "loading") {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-6 w-96 max-w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("manage.errorTitle")}</AlertTitle>
          <AlertDescription>
            {t("manage.errorBody")}
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              clear();
              toast.message(t("manage.clearedDamaged"));
            }}
          >
            {t("manage.clearDamaged")}
          </Button>
          <Button
            onClick={() => {
              save(sampleMembership());
              toast.success(t("manage.sampleLoaded"));
            }}
          >
            {t("manage.loadSample")}
          </Button>
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-slate">
          {t("manage.memberPortal")}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">{t("manage.emptyHeadline")}</h1>
        <p className="mt-3 text-muted-foreground">
          {t("manage.emptyBody")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/join">{t("success.become")}</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              save(sampleMembership());
              toast.success(t("manage.sampleLoaded"));
            }}
          >
            {t("manage.loadSample")}
          </Button>
        </div>
      </div>
    );
  }

  const current = membership;
  const impact = impactFromMembership(current);
  const paidReceipts = current.receipts.filter((r) => r.status === "paid");

  function applyPlan() {
    const plan = PLANS.find((p) => p.id === planDraft);
    if (!plan) return;
    const now = new Date().toISOString();
    save({
      ...current,
      planId: plan.id,
      amount: plan.monthly,
      status: current.status === "canceled" ? "active" : current.status,
      canceledAt: null,
      nextBillingAt:
        current.status === "paused" ? current.nextBillingAt : addInterval(now, current.interval),
    });
    setPlanOpen(false);
    toast.success(t("manage.planSaved", { name: planCopy(plan.id, locale).name }));
  }

  function applyCard() {
    const digits = cardDraft.replace(/\s/g, "");
    if (!/^\d{16}$/.test(digits)) {
      toast.error(t("manage.cardInvalid"));
      return;
    }
    save({
      ...current,
      lastFour: digits.slice(-4),
      cardBrand: digits.startsWith("5") ? "Mastercard" : "Visa",
    });
    setCardOpen(false);
    setCardDraft("");
    toast.success(t("manage.cardSaved"));
  }

  function pauseOrResume() {
    if (current.status === "paused") {
      const now = new Date().toISOString();
      save({
        ...current,
        status: "active",
        pausedAt: null,
        nextBillingAt: addInterval(now, current.interval),
      });
      toast.success(t("manage.resumed"));
      return;
    }
    save({
      ...current,
      status: "paused",
      pausedAt: new Date().toISOString(),
      nextBillingAt: null,
    });
    toast.message(t("manage.pausedToast"));
  }

  function cancelMembership() {
    save({
      ...current,
      status: "canceled",
      canceledAt: new Date().toISOString(),
      nextBillingAt: null,
    });
    setCancelOpen(false);
    toast.message(t("manage.canceledToast"));
  }

  function addMockCharge() {
    const now = new Date().toISOString();
    const amount = periodAmount(current.amount, current.interval);
    save({
      ...current,
      receipts: [
        ...current.receipts,
        { id: generateReceiptId(), date: now, amount, interval: current.interval, status: "paid" },
      ],
      nextBillingAt: addInterval(now, current.interval),
    });
    toast.success(t("manage.recordedReceipt", { amount: formatMoneyForLocale(amount, locale) }));
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-slate">
          {t("manage.memberPortal")}
        </p>
          <h1 className="mt-2 text-4xl font-extrabold">{t("manage.hello", { name: membership.firstName })}</h1>
          <p className="mt-2 text-muted-foreground">
            {membership.memberId} · {membership.email}
          </p>
        </div>
        {statusBadge(membership.status, t)}
      </div>

      {membership.status === "canceled" && (
        <Alert className="mt-6">
          <AlertTitle>{t("manage.canceledTitle")}</AlertTitle>
          <AlertDescription>
            {t("manage.canceledBody")}
          </AlertDescription>
        </Alert>
      )}

      {membership.status === "paused" && (
        <Alert className="mt-6 border-brand-slate/30">
          <AlertTitle>
            {t("manage.pausedTitle", {
              date: membership.pausedAt ? formatDateForLocale(membership.pausedAt, locale) : t("manage.pausedRecently"),
            })}
          </AlertTitle>
          <AlertDescription>
            {t("manage.pausedBody")}
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="bg-white">
          <CardHeader>
            <CardDescription>{t("manage.currentPlan")}</CardDescription>
            <CardTitle className="font-heading text-2xl">
              {membership.planId === "custom"
                ? t("plans.custom.name")
                : planCopy(membership.planId, locale).name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {formatMoneyForLocale(periodAmount(membership.amount, membership.interval), locale)} /{" "}
              {membership.interval === "annual" ? t("interval.year") : t("interval.month")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader>
            <CardDescription>{t("manage.given")}</CardDescription>
            <CardTitle className="font-heading text-2xl">{formatMoneyForLocale(impact.given, locale)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("manage.givenImpact", { cases: impact.cases, responses: impact.responses })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader>
            <CardDescription>{t("manage.nextBilling")}</CardDescription>
            <CardTitle className="font-heading text-2xl">
              {membership.nextBillingAt ? formatDateForLocale(membership.nextBillingAt, locale) : t("manage.notScheduled")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {paymentBrandLabel(membership.cardBrand, locale)}
              {membership.lastFour ? ` ···· ${membership.lastFour}` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="impact" className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="impact">{t("manage.tabImpact")}</TabsTrigger>
          <TabsTrigger value="billing">{t("manage.tabBilling")}</TabsTrigger>
          <TabsTrigger value="settings">{t("manage.tabSettings")}</TabsTrigger>
        </TabsList>
        <TabsContent value="impact" className="mt-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-heading text-xl">{t("manage.yearInField")}</CardTitle>
              <CardDescription>
                {t("manage.yearCaption", {
                  given: formatMoneyForLocale(impact.given, locale),
                  months:
                    impact.months === 1
                      ? t("manage.monthOne")
                      : t("manage.monthMany", { count: impact.months }),
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{t("manage.verification")}</span>
                  <span className="font-medium">{t("manage.reports", { count: impact.cases })}</span>
                </div>
                <Progress value={Math.min(100, impact.cases * 4)} />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{t("manage.fieldResponse")}</span>
                  <span className="font-medium">{t("manage.deployments", { count: impact.responses })}</span>
                </div>
                <Progress value={Math.min(100, impact.responses * 6)} />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{t("manage.evidence")}</span>
                  <span className="font-medium">{t("manage.packets", { count: impact.followUps })}</span>
                </div>
                <Progress value={Math.min(100, impact.followUps * 8)} />
              </div>
              {membership.dedication && (
                <p className="text-sm text-muted-foreground">{t("manage.dedication", { text: membership.dedication })}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="billing" className="mt-4 space-y-4">
          <Card className="bg-white">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="font-heading text-xl">{t("manage.receipts")}</CardTitle>
                <CardDescription>{t("manage.receiptsBody")}</CardDescription>
              </div>
              {membership.status === "active" && (
                <Button variant="outline" size="sm" onClick={addMockCharge}>
                  {t("manage.recordCharge")}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {paidReceipts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("manage.noReceipts")}
                </p>
              ) : (
                <ul className="divide-y">
                  {[...paidReceipts].reverse().map((receipt) => (
                    <li key={receipt.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{receipt.id}</p>
                        <p className="text-muted-foreground">{formatDateForLocale(receipt.date, locale)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatMoneyForLocale(receipt.amount, locale)}</p>
                        <button
                          type="button"
                          className="text-xs text-brand-slate underline-offset-2 hover:underline"
                          onClick={() => toast.message(t("manage.downloadToast"))}
                        >
                          {t("manage.download")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-heading text-xl">{t("manage.planAndPayment")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">{t("manage.changePlan")}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("manage.switchPlan")}</DialogTitle>
                    <DialogDescription>
                      {t("manage.switchPlanBody")}
                    </DialogDescription>
                  </DialogHeader>
                  <Select value={planDraft} onValueChange={(v) => setPlanDraft(v as PlanId)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANS.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {planCopy(plan.id, locale).name} · {formatMoneyForLocale(plan.monthly, locale)}/{t("interval.month")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DialogFooter>
                    <Button onClick={applyPlan}>{t("manage.savePlan")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={cardOpen} onOpenChange={setCardOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CreditCard />
                    {t("manage.updateCard")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("manage.replaceCard")}</DialogTitle>
                    <DialogDescription>{t("manage.replaceCardBody")}</DialogDescription>
                  </DialogHeader>
                  <div>
                    <Label htmlFor="newCard">{t("manage.cardNumber")}</Label>
                    <Input
                      id="newCard"
                      className="mt-2"
                      value={cardDraft}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setCardDraft(digits.replace(/(\d{4})(?=\d)/g, "$1 "));
                      }}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={applyCard}>{t("manage.saveCard")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={pauseOrResume} disabled={membership.status === "canceled"}>
                {membership.status === "paused" ? <Play /> : <Pause />}
                {membership.status === "paused" ? t("manage.resume") : t("manage.pause")}
              </Button>

              <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={membership.status === "canceled"}>
                    {t("manage.cancel")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("manage.cancelTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("manage.cancelBody")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCancelOpen(false)}>
                      {t("manage.keepIt")}
                    </Button>
                    <Button variant="destructive" onClick={cancelMembership}>
                      {t("manage.yesCancel")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-heading text-xl">{t("manage.prototypeTools")}</CardTitle>
              <CardDescription>{t("manage.prototypeBody")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  clear();
                  toast.message(t("manage.clearedMembership"));
                }}
              >
                <Trash2 />
                {t("manage.clearMembership")}
              </Button>
              <Button asChild variant="ghost">
                <Link href="/join">{t("manage.joinSomeoneElse")}</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
