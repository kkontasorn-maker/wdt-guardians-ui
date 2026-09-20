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
import {
  addInterval,
  formatDate,
  formatMoney,
  generateReceiptId,
  impactFromMembership,
  periodAmount,
  PLANS,
  sampleMembership,
  type Membership,
  type PlanId,
} from "@/lib/membership";

function statusBadge(status: Membership["status"]) {
  if (status === "active") return <Badge className="bg-brand-orange hover:bg-brand-deep">Active</Badge>;
  if (status === "paused")
    return (
      <Badge variant="outline" className="border-brand-slate text-brand-slate">
        Paused
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-destructive">
      Canceled
    </Badge>
  );
}

export default function ManagePage() {
  const { membership, state, save, clear } = useMembership();
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
          <AlertTitle>The member record would not load</AlertTitle>
          <AlertDescription>
            Local membership data is unreadable. Clear it and start again, or load the sample WDT 399 member so you
            can still tour the portal.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              clear();
              toast.message("Cleared damaged membership data.");
            }}
          >
            Clear damaged data
          </Button>
          <Button
            onClick={() => {
              save(sampleMembership());
              toast.success("Loaded Niran Srisawat’s sample WDT 399 membership.");
            }}
          >
            Load sample member
          </Button>
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-slate">
          Member portal
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">No Guardian in this browser yet.</h1>
        <p className="mt-3 text-muted-foreground">
          Join to create a mock membership, or load a sample WDT 399 Guardian to explore pause, receipts, and plan
          changes without filling the form.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/join">Become a Guardian</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              save(sampleMembership());
              toast.success("Loaded Niran Srisawat’s sample WDT 399 membership.");
            }}
          >
            Load sample member
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
    toast.success(`You’re now on ${plan.name}.`);
  }

  function applyCard() {
    const digits = cardDraft.replace(/\s/g, "");
    if (!/^\d{16}$/.test(digits)) {
      toast.error("Enter a 16-digit mock card number.");
      return;
    }
    save({
      ...current,
      lastFour: digits.slice(-4),
      cardBrand: digits.startsWith("5") ? "Mastercard" : "Visa",
    });
    setCardOpen(false);
    setCardDraft("");
    toast.success("Payment method updated.");
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
      toast.success("Membership resumed. The next mock charge is on the calendar.");
      return;
    }
    save({
      ...current,
      status: "paused",
      pausedAt: new Date().toISOString(),
      nextBillingAt: null,
    });
    toast.message("Membership paused. No further mock charges will be scheduled.");
  }

  function cancelMembership() {
    save({
      ...current,
      status: "canceled",
      canceledAt: new Date().toISOString(),
      nextBillingAt: null,
    });
    setCancelOpen(false);
    toast.message("Membership canceled. You can rejoin any time.");
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
    toast.success(`Recorded a mock ${formatMoney(amount)} receipt.`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-slate">
            Member portal
          </p>
          <h1 className="mt-2 text-4xl font-extrabold">Hello, {membership.firstName}.</h1>
          <p className="mt-2 text-muted-foreground">
            {membership.memberId} · {membership.email}
          </p>
        </div>
        {statusBadge(membership.status)}
      </div>

      {membership.status === "canceled" && (
        <Alert className="mt-6">
          <AlertTitle>This membership is canceled</AlertTitle>
          <AlertDescription>
            Your giving history is still here. Rejoin from the join form, or switch to a plan below to
            reactivate this mock record.
          </AlertDescription>
        </Alert>
      )}

      {membership.status === "paused" && (
        <Alert className="mt-6 border-brand-slate/30">
          <AlertTitle>Paused since {membership.pausedAt ? formatDate(membership.pausedAt) : "recently"}</AlertTitle>
          <AlertDescription>
            Field notes from the desk will pause with billing. Resume when you are ready — your member ID stays the same.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="bg-white">
          <CardHeader>
            <CardDescription>Current plan</CardDescription>
            <CardTitle className="font-heading text-2xl">
              {membership.planId === "custom" ? "Custom" : PLANS.find((p) => p.id === membership.planId)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {formatMoney(periodAmount(membership.amount, membership.interval))} /{" "}
              {membership.interval === "annual" ? "year" : "month"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader>
            <CardDescription>Given with this membership</CardDescription>
            <CardTitle className="font-heading text-2xl">{formatMoney(impact.given)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              About {impact.cases} verified reports and {impact.responses} field responses.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader>
            <CardDescription>Next mock billing</CardDescription>
            <CardTitle className="font-heading text-2xl">
              {membership.nextBillingAt ? formatDate(membership.nextBillingAt) : "Not scheduled"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {membership.cardBrand}
              {membership.lastFour ? ` ···· ${membership.lastFour}` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="impact" className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="impact" className="mt-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Your year in the field</CardTitle>
              <CardDescription>
                Rough translations of {formatMoney(impact.given)} over {impact.months} month
                {impact.months === 1 ? "" : "s"} of membership. Not an official audit figure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Verification</span>
                  <span className="font-medium">{impact.cases} reports</span>
                </div>
                <Progress value={Math.min(100, impact.cases * 4)} />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Field response</span>
                  <span className="font-medium">{impact.responses} deployments</span>
                </div>
                <Progress value={Math.min(100, impact.responses * 6)} />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Evidence follow-up</span>
                  <span className="font-medium">{impact.followUps} packets</span>
                </div>
                <Progress value={Math.min(100, impact.followUps * 8)} />
              </div>
              {membership.dedication && (
                <p className="text-sm text-muted-foreground">Dedication: {membership.dedication}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="billing" className="mt-4 space-y-4">
          <Card className="bg-white">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="font-heading text-xl">Receipts</CardTitle>
                <CardDescription>Mock charges stored on this device.</CardDescription>
              </div>
              {membership.status === "active" && (
                <Button variant="outline" size="sm" onClick={addMockCharge}>
                  Record a mock charge
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {paidReceipts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No receipts yet. Join or record a mock charge to see giving history.
                </p>
              ) : (
                <ul className="divide-y">
                  {[...paidReceipts].reverse().map((receipt) => (
                    <li key={receipt.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{receipt.id}</p>
                        <p className="text-muted-foreground">{formatDate(receipt.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatMoney(receipt.amount)}</p>
                        <button
                          type="button"
                          className="text-xs text-brand-slate underline-offset-2 hover:underline"
                          onClick={() => toast.message("In production this would download a PDF receipt.")}
                        >
                          Download
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
              <CardTitle className="font-heading text-xl">Plan and payment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Change plan</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Switch Guardian plan</DialogTitle>
                    <DialogDescription>
                      Amounts are monthly. Annual members keep their interval; the next mock charge uses the
                      new plan.
                    </DialogDescription>
                  </DialogHeader>
                  <Select value={planDraft} onValueChange={(v) => setPlanDraft(v as PlanId)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANS.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} · {formatMoney(plan.monthly)}/mo
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DialogFooter>
                    <Button onClick={applyPlan}>Save plan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={cardOpen} onOpenChange={setCardOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CreditCard />
                    Update card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Replace mock card</DialogTitle>
                    <DialogDescription>Stored only in localStorage. Use any 16 digits.</DialogDescription>
                  </DialogHeader>
                  <div>
                    <Label htmlFor="newCard">Card number</Label>
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
                    <Button onClick={applyCard}>Save card</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={pauseOrResume} disabled={membership.status === "canceled"}>
                {membership.status === "paused" ? <Play /> : <Pause />}
                {membership.status === "paused" ? "Resume membership" : "Pause membership"}
              </Button>

              <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={membership.status === "canceled"}>
                    Cancel membership
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel this Guardian membership?</DialogTitle>
                    <DialogDescription>
                      The mock record stays in the browser so you can still read receipts. You will not be
                      billed again.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCancelOpen(false)}>
                      Keep it
                    </Button>
                    <Button variant="destructive" onClick={cancelMembership}>
                      Yes, cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Prototype tools</CardTitle>
              <CardDescription>These controls exist only so reviewers can reset the demo.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  clear();
                  toast.message("Membership cleared from this browser.");
                }}
              >
                <Trash2 />
                Clear this membership
              </Button>
              <Button asChild variant="ghost">
                <Link href="/join">Join as someone else</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
