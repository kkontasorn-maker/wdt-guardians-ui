"use client";

import { useMemo, useState } from "react";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { TablePagination } from "@/components/admin/table-pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayAmount, displayDate, PAGE_SIZE, PAYMENTS } from "@/lib/mockData";

export default function AdminPaymentsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return PAYMENTS.filter((row) => {
      if (from && row.date < from) return false;
      if (to && row.date > to) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [from, to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Payments</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gateway events for the same Guardian IDs as Members — demo charges only.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:max-w-md">
        <div>
          <Label htmlFor="pay-from">From</Label>
          <Input
            id="pay-from"
            type="date"
            className="mt-1.5 h-11"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div>
          <Label htmlFor="pay-to">To</Label>
          <Input
            id="pay-to"
            type="date"
            className="mt-1.5 h-11"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        <AdminTable>
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Guardian ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No payments in that date range.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap tabular-nums">{displayDate(row.date)}</TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs font-medium">
                  {row.guardianId}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{displayAmount(row.amount)}</TableCell>
                <TableCell>{row.method}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AdminTable>
        <TablePagination
          page={safePage}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPage={setPage}
        />
      </div>
    </div>
  );
}
