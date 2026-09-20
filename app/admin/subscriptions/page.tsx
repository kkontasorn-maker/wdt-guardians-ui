"use client";

import { useMemo, useState } from "react";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { TablePagination } from "@/components/admin/table-pagination";
import { Switch } from "@/components/ui/switch";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayDate, PAGE_SIZE, SUBSCRIPTIONS } from "@/lib/mockData";

export default function AdminSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [autoRenew, setAutoRenew] = useState(() =>
    Object.fromEntries(SUBSCRIPTIONS.map((row) => [row.id, row.autoRenew]))
  );

  const pageCount = Math.max(1, Math.ceil(SUBSCRIPTIONS.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = useMemo(
    () => SUBSCRIPTIONS.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [safePage]
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Subscriptions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Billing cycle and auto-renew for each Guardian. Toggles are visual only.
      </p>

      <div className="mt-4">
        <AdminTable>
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-transparent">
              <TableHead>Guardian ID</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Billing cycle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next charge</TableHead>
              <TableHead className="text-right">Auto-renew</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs font-medium">
                  {row.guardianId}
                </TableCell>
                <TableCell>{row.plan}</TableCell>
                <TableCell>{row.cycle}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {displayDate(row.nextCharge)}
                </TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={autoRenew[row.id]}
                    disabled={row.status === "Cancelled"}
                    onCheckedChange={(checked) =>
                      setAutoRenew((current) => ({ ...current, [row.id]: checked }))
                    }
                    aria-label={`Auto-renew ${row.guardianId}`}
                    className="h-6 w-11"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AdminTable>
        <TablePagination
          page={safePage}
          pageSize={PAGE_SIZE}
          total={SUBSCRIPTIONS.length}
          onPage={setPage}
        />
      </div>
    </div>
  );
}
