import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES = {
  success: "border-transparent bg-emerald-50 text-emerald-800",
  pending: "border-transparent bg-amber-50 text-amber-900",
  rust: "border-transparent bg-brand-rust/10 text-brand-rust",
} as const;

export function StatusBadge({
  status,
}: {
  status: "Active" | "Past Due" | "Cancelled" | "Success" | "Failed" | "Pending";
}) {
  const tone =
    status === "Active" || status === "Success"
      ? STYLES.success
      : status === "Pending" || status === "Past Due"
        ? STYLES.pending
        : STYLES.rust;

  return <Badge className={cn("font-medium", tone)}>{status}</Badge>;
}
