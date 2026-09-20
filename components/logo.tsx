import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
}: {
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "flex min-h-11 min-w-0 items-center gap-2 text-brand-ink sm:gap-2.5",
        className
      )}
      aria-label="WDT Guardians home"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-orange text-white shadow-sm">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16 3.2c-4.8 3.4-8.2 4.6-12.2 5.1 0 8.4 4.2 15.1 12.2 20.5 8-5.4 12.2-12.1 12.2-20.5C24.2 7.8 20.8 6.6 16 3.2Zm0 6.1c1.7 0 2.9 1.1 3.5 2.3-.9.4-1.9.7-3.5.7s-2.6-.3-3.5-.7c.6-1.2 1.8-2.3 3.5-2.3Zm-4.6 5.3c.9.6 2.5 1.1 4.6 1.1s3.7-.5 4.6-1.1c-.2 3.1-1.8 5.8-4.6 8.1-2.8-2.3-4.4-5-4.6-8.1Z"
          />
        </svg>
      </span>
      <span className="truncate font-heading text-[13px] font-extrabold tracking-wide sm:text-[15px] sm:tracking-[0.14em]">
        WDT GUARDIANS
      </span>
    </Link>
  );
}
