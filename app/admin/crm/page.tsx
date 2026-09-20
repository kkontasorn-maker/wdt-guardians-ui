"use client";

import { useMemo, useState } from "react";
import { AdminTable } from "@/components/admin/admin-table";
import { TablePagination } from "@/components/admin/table-pagination";
import { Textarea } from "@/components/ui/textarea";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CRM_CONTACTS, displayDate, PAGE_SIZE } from "@/lib/mockData";

export default function AdminCrmPage() {
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState(() =>
    Object.fromEntries(CRM_CONTACTS.map((row) => [row.id, row.notes]))
  );

  const pageCount = Math.max(1, Math.ceil(CRM_CONTACTS.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = useMemo(
    () => CRM_CONTACTS.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [safePage]
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold">CRM</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Desk notes for this book. Edits stay in this browser tab only.
      </p>

      <div className="mt-4">
        <AdminTable>
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-transparent">
              <TableHead>Guardian ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Last contact</TableHead>
              <TableHead className="min-w-[16rem]">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs font-medium">{row.id}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-sm">{row.email}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {displayDate(row.lastContact)}
                </TableCell>
                <TableCell>
                  <Textarea
                    value={notes[row.id] ?? ""}
                    onChange={(e) => setNotes((current) => ({ ...current, [row.id]: e.target.value }))}
                    rows={2}
                    className="min-h-11 py-2 text-sm"
                    aria-label={`Notes for ${row.id}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AdminTable>
        <TablePagination
          page={safePage}
          pageSize={PAGE_SIZE}
          total={CRM_CONTACTS.length}
          onPage={setPage}
        />
      </div>
    </div>
  );
}
