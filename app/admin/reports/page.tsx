"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AS_OF,
  FAILED_PAYMENTS,
  FOUNDING_MEMBERS,
  MEMBERS,
  PAYMENTS,
  displayAmount,
  inDateRange,
} from "@/lib/mockData";

type ReportKey = "membership" | "payments" | "failed" | "founding";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function toCsv(headers: string[], rows: string[][]) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export default function AdminReportsPage() {
  const [from, setFrom] = useState("2026-08-01");
  const [to, setTo] = useState(AS_OF);

  const membershipRows = useMemo(
    () => MEMBERS.filter((row) => inDateRange(row.joinedAt, from, to)),
    [from, to]
  );
  const paymentRows = useMemo(
    () => PAYMENTS.filter((row) => inDateRange(row.date, from, to)),
    [from, to]
  );
  const failedRows = useMemo(
    () => FAILED_PAYMENTS.filter((row) => inDateRange(row.failedOn, from, to)),
    [from, to]
  );
  const foundingRows = useMemo(
    () => FOUNDING_MEMBERS.filter((row) => inDateRange(row.joinedAt, from, to)),
    [from, to]
  );

  const reports: {
    key: ReportKey;
    title: string;
    blurb: string;
    countLabel: string;
    csv: string;
  }[] = [
    {
      key: "membership",
      title: "Membership Summary",
      blurb: "Guardians who joined in this window, with plan and status.",
      countLabel: `${membershipRows.length} members`,
      csv: toCsv(
        ["guardian_id", "name", "email", "plan", "status", "joined", "next_renewal"],
        membershipRows.map((row) => [
          row.id,
          row.name,
          row.email,
          row.plan,
          row.status,
          row.joinedAt,
          row.nextRenewal ?? "",
        ])
      ),
    },
    {
      key: "payments",
      title: "Payment Reconciliation",
      blurb: "Gateway charges for the same Guardian IDs as Members.",
      countLabel: `${paymentRows.length} charges · ${paymentRows.filter((row) => row.status === "Success").length} success`,
      csv: toCsv(
        ["date", "guardian_id", "amount", "method", "status"],
        paymentRows.map((row) => [
          row.date,
          row.guardianId,
          String(row.amount),
          row.method,
          row.status,
        ])
      ),
    },
    {
      key: "failed",
      title: "Failed Payment Log",
      blurb: "Declines in this window, with retry stage from the failed-payment book.",
      countLabel: `${failedRows.length} failures · ${displayAmount(failedRows.reduce((sum, row) => sum + row.amount, 0))} at risk`,
      csv: toCsv(
        ["guardian_id", "amount", "reason", "failed_on", "days_since_failure", "retry_stage"],
        failedRows.map((row) => [
          row.guardianId,
          String(row.amount),
          row.reason,
          row.failedOn,
          String(row.daysSinceFailure),
          String(row.retryStage),
        ])
      ),
    },
    {
      key: "founding",
      title: "Founding Guardian Roster",
      blurb: "Founding-flagged members from this book who joined in range.",
      countLabel: `${foundingRows.length} founding in range`,
      csv: toCsv(
        ["guardian_id", "name", "plan", "joined"],
        foundingRows.map((row) => [row.id, row.name, row.plan, row.joinedAt])
      ),
    },
  ];

  function prepareCsv(title: string, csv: string) {
    console.info(`[WDT mock CSV] ${title}\n${csv}`);
    toast.success("CSV prepared");
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Reports & Export</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Mock extracts from this book. Download logs a CSV to the console — no file is written.
      </p>

      <div className="mt-4 grid max-w-md gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="report-from">From</Label>
          <Input
            id="report-from"
            type="date"
            className="mt-1.5 h-11"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="report-to">To</Label>
          <Input
            id="report-to"
            type="date"
            className="mt-1.5 h-11"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.key} className="rounded-lg shadow-sm">
            <CardContent className="flex h-full flex-col p-4">
              <p className="font-heading text-base font-extrabold">{report.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{report.blurb}</p>
              <p className="mt-3 text-xs font-medium tabular-nums text-brand-ink">{report.countLabel}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full sm:w-auto"
                onClick={() => prepareCsv(report.title, report.csv)}
              >
                <Download />
                Download CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
