import { FOUNDING_CAMPAIGN } from "@/lib/mockData";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/failed-payments", label: "Failed Payments" },
  { href: "/admin/founding-guardians", label: "Founding Guardians" },
  { href: "/admin/crm", label: "CRM" },
  { href: "/admin/booth-monitor", label: "Booth Monitor" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit-log", label: "Audit Log" },
] as const;

export type AdminNavHref = (typeof ADMIN_NAV)[number]["href"];

export const SYSTEM_OF_TRUTH = [
  { name: "Payment Gateway", role: "Payment Truth" },
  { name: "Membership DB", role: "Membership Truth" },
  { name: "CRM", role: "Communication Truth" },
  { name: "Accounting", role: "Financial Ledger" },
];

export const LAUNCH_OPS = [
  {
    label: "Founding Guardians",
    value: `${FOUNDING_CAMPAIGN.confirmed.toLocaleString("en-US")} confirmed`,
    percent: (FOUNDING_CAMPAIGN.confirmed / FOUNDING_CAMPAIGN.total) * 100,
  },
  { label: "CRM Sync", value: "99.6%", percent: 99.6 },
  { label: "Booth Funnel", value: "37%", percent: 37 },
  { label: "Audit Log", value: "100% tracked", percent: 100 },
];

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
