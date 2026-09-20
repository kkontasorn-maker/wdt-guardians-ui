import { AdminTable } from "@/components/admin/admin-table";
import { RetryStageTracker } from "@/components/admin/retry-stage-tracker";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayAmount, FAILED_PAYMENTS } from "@/lib/mockData";

export default function AdminFailedPaymentsPage() {
  const rows = [...FAILED_PAYMENTS].sort((a, b) => b.failedOn.localeCompare(a.failedOn));

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Failed Payment Center</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {rows.length} failed charges in this book. Retry ladder is Day 1 → Day 3 → Day 7 grace.
      </p>

      <div className="mt-4">
        <AdminTable>
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-transparent">
              <TableHead>Guardian ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Failure reason</TableHead>
              <TableHead>Days since failure</TableHead>
              <TableHead>Retry stage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs font-medium">
                  {row.guardianId}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{displayAmount(row.amount)}</TableCell>
                <TableCell>
                  <Badge className="border-transparent bg-brand-rust/10 font-medium text-brand-rust">
                    {row.reason}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">{row.daysSinceFailure}</TableCell>
                <TableCell>
                  <RetryStageTracker stage={row.retryStage} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AdminTable>
      </div>
    </div>
  );
}
