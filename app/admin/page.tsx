import Link from "next/link";
import { ArrowUpRight, CircleAlert, Info } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LAUNCH_OPS, SYSTEM_OF_TRUTH } from "@/lib/admin";
import {
  DASHBOARD_STATS,
  displayDate,
  failedPaymentCount,
  pendingPaymentCount,
  recentMembers,
} from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chiang Mai desk snapshot — demo figures, not live charges.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_STATS.map((stat) => (
          <Card key={stat.label} className="rounded-lg shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1.5 font-heading text-2xl font-extrabold tabular-nums">{stat.value}</p>
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 text-xs",
                  stat.tone === "up" ? "text-emerald-700" : "text-muted-foreground"
                )}
              >
                {stat.tone === "up" && <ArrowUpRight className="h-3.5 w-3.5" />}
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Link href="/admin/failed-payments" className="block">
          <Card className="h-full rounded-lg border-amber-300/80 bg-amber-50/80 shadow-sm">
            <CardContent className="flex gap-3 p-4">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-deep" />
              <div>
                <p className="font-heading text-base font-extrabold text-brand-ink">
                  {failedPaymentCount} Failed Payments
                </p>
                <p className="mt-1 text-sm text-brand-ink/75">
                  Retry and grace flow needs follow-up before the next renewal window.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/payments" className="block">
          <Card className="h-full rounded-lg border-brand-slate/25 bg-[rgba(47,72,88,0.06)] shadow-sm">
            <CardContent className="flex gap-3 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-slate" />
              <div>
                <p className="font-heading text-base font-extrabold text-brand-ink">
                  {pendingPaymentCount} Pending Payment Verifications
                </p>
                <p className="mt-1 text-sm text-brand-ink/75">
                  Do not activate membership before server confirmation from the gateway.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          System of Truth
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SYSTEM_OF_TRUTH.map((item) => (
            <div
              key={item.name}
              className="rounded-lg border border-border bg-white px-3 py-3 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-orange">
                {item.role}
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-ink">{item.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <Card className="rounded-lg shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="font-heading text-base font-extrabold">Recent Members</h2>
              <Link href="/admin/members" className="text-xs font-medium text-brand-deep hover:underline">
                View all
              </Link>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Guardian ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Next renewal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMembers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs font-medium">{row.id}</TableCell>
                    <TableCell>{row.plan}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {displayDate(row.nextRenewal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm">
          <CardContent className="p-4">
            <h2 className="font-heading text-base font-extrabold">Launch Operations</h2>
            <ul className="mt-4 space-y-4">
              {LAUNCH_OPS.map((item) => (
                <li key={item.label}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="tabular-nums text-muted-foreground">{item.value}</span>
                  </div>
                  <Progress value={item.percent} className="mt-2 h-1.5" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
