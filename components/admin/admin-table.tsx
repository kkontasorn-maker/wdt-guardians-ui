import { cn } from "@/lib/utils";

export function AdminTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative max-h-[min(36rem,calc(100vh-14rem))] overflow-auto rounded-lg border border-border bg-white shadow-sm",
        className
      )}
    >
      <table className="w-full caption-bottom text-sm">{children}</table>
    </div>
  );
}
