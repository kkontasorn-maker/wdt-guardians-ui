"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart3,
  Contact,
  CreditCard,
  FileText,
  LayoutDashboard,
  MonitorSmartphone,
  RefreshCw,
  ScrollText,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ADMIN_NAV, isAdminNavActive } from "@/lib/admin";
import { cn } from "@/lib/utils";

const ICONS: Record<(typeof ADMIN_NAV)[number]["href"], LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/members": Users,
  "/admin/payments": CreditCard,
  "/admin/subscriptions": RefreshCw,
  "/admin/failed-payments": TriangleAlert,
  "/admin/founding-guardians": Award,
  "/admin/crm": Contact,
  "/admin/booth-monitor": MonitorSmartphone,
  "/admin/content": FileText,
  "/admin/reports": BarChart3,
  "/admin/audit-log": ScrollText,
};

export function AdminSidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-3 pb-6">
      {ADMIN_NAV.map((item) => {
        const Icon = ICONS[item.href];
        const active = isAdminNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-brand-orange text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminWordmark() {
  return (
    <Link
      href="/admin"
      className="flex min-h-14 items-center px-4 text-white"
      aria-label="WDT Guardians backoffice"
    >
      <span className="font-heading text-[13px] font-extrabold tracking-[0.16em]">
        WDT GUARDIANS
      </span>
    </Link>
  );
}
