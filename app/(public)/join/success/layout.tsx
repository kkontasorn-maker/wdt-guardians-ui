import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You are now a WDT Guardian",
  description: "Your WDT Guardians membership is active.",
};

export default function JoinSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
