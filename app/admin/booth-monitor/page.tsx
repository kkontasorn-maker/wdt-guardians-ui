"use client";

import { useEffect, useRef, useState } from "react";
import { AdminTable } from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BOOTH_QUEUE, displayTime, type BoothDevice } from "@/lib/mockData";

type FeedRow = {
  id: string;
  guardianId: string;
  plan: string;
  device: BoothDevice;
  at: string;
  fresh?: boolean;
};

const INITIAL_COUNT = 5;
const MAX_ROWS = 18;
const TICK_MS = 3500;

export default function AdminBoothMonitorPage() {
  const seq = useRef(INITIAL_COUNT);
  const [rows, setRows] = useState<FeedRow[]>(() => {
    const start = Date.now();
    return BOOTH_QUEUE.slice(0, INITIAL_COUNT)
      .map((item, i) => ({
        id: `booth-${i + 1}`,
        guardianId: item.guardianId,
        plan: item.plan,
        device: item.device,
        at: new Date(start - (INITIAL_COUNT - i) * 18_000).toISOString(),
      }))
      .reverse();
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRows((current) => {
        const next = BOOTH_QUEUE[seq.current % BOOTH_QUEUE.length];
        seq.current += 1;
        const row: FeedRow = {
          id: `booth-${seq.current}`,
          guardianId: next.guardianId,
          plan: next.plan,
          device: next.device,
          at: new Date().toISOString(),
          fresh: true,
        };
        return [row, ...current.map((item) => ({ ...item, fresh: false }))].slice(0, MAX_ROWS);
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Booth Monitor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo feed of booth sign-ups. Newest first — no live websocket.
          </p>
        </div>
        <Badge className="border-transparent bg-emerald-50 font-medium text-emerald-800">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
          Live demo
        </Badge>
      </div>

      <div className="mt-4">
        <AdminTable>
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-transparent">
              <TableHead>Guardian ID</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Device</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={row.fresh ? "bg-accent/60" : undefined}>
                <TableCell className="whitespace-nowrap font-mono text-xs font-medium">
                  {row.guardianId}
                </TableCell>
                <TableCell>{row.plan}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{displayTime(row.at)}</TableCell>
                <TableCell className="text-muted-foreground">{row.device}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AdminTable>
      </div>
    </div>
  );
}
