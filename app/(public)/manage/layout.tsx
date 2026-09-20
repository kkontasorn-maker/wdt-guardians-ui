import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage membership",
  description: "View your WDT Guardians plan, receipts, and billing settings.",
};

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
