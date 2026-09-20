import { AdminTable } from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_EVENTS, displayDateTime } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function AdminAuditLogPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Audit Log</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {AUDIT_EVENTS.length} mock system events for this book — newest first. Demo only.
      </p>

      <div className="mt-4">
        <AdminTable>
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[11.5rem]">Timestamp</TableHead>
              <TableHead className="w-[9.5rem]">Actor</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {AUDIT_EVENTS.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                        index === 0 ? "bg-brand-orange" : "bg-border"
                      )}
                      aria-hidden
                    />
                    {displayDateTime(row.at)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      row.actor === "System"
                        ? "border-brand-slate/25 bg-[rgba(47,72,88,0.06)] text-brand-slate"
                        : "border-brand-orange/30 bg-accent text-brand-deep"
                    )}
                  >
                    {row.actor}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{row.action}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AdminTable>
      </div>
    </div>
  );
}
