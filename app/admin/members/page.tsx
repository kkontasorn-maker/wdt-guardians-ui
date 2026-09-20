"use client";

import { useMemo, useState } from "react";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { TablePagination } from "@/components/admin/table-pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayDate, MEMBERS, PAGE_SIZE, type MemberStatus } from "@/lib/mockData";

export default function AdminMembersPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | MemberStatus>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEMBERS.filter((row) => {
      const matchesQuery =
        !q || row.id.toLowerCase().includes(q) || row.name.toLowerCase().includes(q);
      const matchesStatus = status === "all" || row.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Members</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Working book of {MEMBERS.length} Guardians — demo data, not a live roster.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search ID or name"
          aria-label="Search members"
          className="h-11 sm:max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as "all" | MemberStatus);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 min-h-11 sm:w-48" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Past Due">Past Due</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        <AdminTable>
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-transparent">
              <TableHead>Guardian ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Next renewal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No members match those filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs font-medium">{row.id}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.plan}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {displayDate(row.joinedAt)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                  {displayDate(row.nextRenewal)}
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
