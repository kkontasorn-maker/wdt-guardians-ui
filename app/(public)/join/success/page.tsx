"use client";

import Link from "next/link";
import { CheckCircle2, FileText, Mail, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembership } from "@/lib/hooks";
import { formatDate, formatMoney, periodAmount, planById } from "@/lib/membership";

async function saveGuardianId(memberId: string) {
  try {
    await navigator.clipboard.writeText(memberId);
    toast.success("Guardian ID copied.");
  } catch {
    const blob = new Blob([memberId], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${memberId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Guardian ID saved as a text file.");
  }
}

export default function JoinSuccessPage() {
  const { membership, state } = useMembership();

  if (state === "loading") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4 px-5 py-16 sm:px-6">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto h-10 w-72 max-w-full" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto w-full max-w-lg px-5 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-extrabold">We could not load your confirmation</h1>
        <p className="mt-3 text-muted-foreground">
          Membership data in this browser looks damaged. Clear it from the member portal and join again.
        </p>
        <Button asChild className="mt-6">
          <Link href="/manage">See member benefits</Link>
        </Button>
      </div>
    );
  }

  if (!membership || membership.status === "canceled") {
    return (
      <div className="mx-auto w-full max-w-lg px-5 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-extrabold">No membership to confirm</h1>
        <p className="mt-3 text-muted-foreground">
          This page appears after you confirm a Guardian plan. Join to receive your ID card.
        </p>
        <Button asChild className="mt-6">
          <Link href="/join">Become a Guardian</Link>
        </Button>
      </div>
    );
  }

  const plan = planById(membership.planId);
  const supportLevel = `${plan.name} · ${formatMoney(periodAmount(membership.amount, membership.interval))} / ${
    membership.interval === "annual" ? "year" : "month"
  }`;

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-10 sm:px-6 sm:py-16">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-brand-orange">
          <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
        </span>
        <h1 className="mt-5 text-[1.75rem] font-extrabold leading-tight sm:text-4xl">You are now a WDT Guardian</h1>
        <p className="mt-3 text-muted-foreground">
          Welcome, {membership.firstName}. Keep this ID — it is how the Chiang Mai desk knows you.
        </p>
      </div>

      <div className="relative mt-10 overflow-hidden rounded-2xl bg-brand-ink px-6 py-8 text-white shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-brand-orange/25" />
        <div className="pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-16 bottom-10 h-14 w-14 rounded-full border border-white/15" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
          WDT Guardians
        </p>
        <p className="relative mt-6 text-xs font-medium uppercase tracking-[0.16em] text-white/55">
          Guardian ID
        </p>
        <p className="relative mt-1 break-all font-heading text-2xl font-extrabold tracking-wide sm:text-4xl sm:tracking-[0.12em]">
          {membership.memberId}
        </p>
        <dl className="relative mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-white/55">Support level</dt>
            <dd className="mt-1 font-medium text-white">{supportLevel}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-white/55">Member since</dt>
            <dd className="mt-1 font-medium text-white">{formatDate(membership.joinedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="w-full sm:flex-1" onClick={() => saveGuardianId(membership.memberId)}>
          Save Guardian ID
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full sm:flex-1">
          <Link href="/manage">See member benefits</Link>
        </Button>
      </div>

      <div className="mt-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
          What happens next
        </p>
        <ul className="mt-5 space-y-4">
          {[
            { icon: Mail, title: "Monthly Guardian Impact Brief" },
            { icon: FileText, title: "Inside WDT updates" },
            { icon: Users, title: "Quarterly Case Room access" },
          ].map((item) => (
            <li key={item.title} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-brand-deep">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="font-medium text-brand-ink">{item.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
