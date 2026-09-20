import { Suspense } from "react";
import type { Metadata } from "next";
import { JoinForm } from "@/components/join-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Join",
  description: "Join WDT Guardians in three steps: choose a plan, add your details, and confirm membership.",
};

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10 sm:px-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full max-w-xl" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <JoinForm />
    </Suspense>
  );
}
