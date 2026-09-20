import { AdminTable } from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayDate, FOUNDING_CAMPAIGN, FOUNDING_MEMBERS } from "@/lib/mockData";

export default function AdminFoundingGuardiansPage() {
  const percent = (FOUNDING_CAMPAIGN.confirmed / FOUNDING_CAMPAIGN.total) * 100;

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Founding Guardians</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Campaign headline is the full 1,000-spot drive. The table is the mock subset in this book.
      </p>

      <Card className="mt-4 rounded-lg shadow-sm">
        <CardContent className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Campaign
          </p>
          <p className="mt-1.5 font-heading text-2xl font-extrabold tabular-nums">
            {FOUNDING_CAMPAIGN.confirmed.toLocaleString("en-US")} /{" "}
            {FOUNDING_CAMPAIGN.total.toLocaleString("en-US")} Founding Guardian spots
          </p>
          <Progress value={percent} className="mt-3 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {percent.toFixed(1)}% filled · {FOUNDING_MEMBERS.length} shown from the demo book
          </p>
        </CardContent>
      </Card>

      <div className="mt-4">
        <AdminTable>
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-transparent">
              <TableHead>Guardian ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FOUNDING_MEMBERS.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs font-medium">{row.id}</TableCell>
                <TableCell className="font-medium">
                  {row.name}
                  <Badge className="ml-2 border-transparent bg-accent text-[10px] font-semibold text-brand-deep">
                    Founding
                  </Badge>
                </TableCell>
                <TableCell>{row.plan}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {displayDate(row.joinedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AdminTable>
      </div>
    </div>
  );
}
