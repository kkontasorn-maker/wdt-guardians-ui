import { cn } from "@/lib/utils";
import type { RetryStage } from "@/lib/mockData";

const STEPS: { id: RetryStage; label: string }[] = [
  { id: 1, label: "Day 1" },
  { id: 3, label: "Day 3" },
  { id: 7, label: "Day 7 grace" },
];

export function RetryStageTracker({ stage }: { stage: RetryStage }) {
  const current = STEPS.findIndex((step) => step.id === stage);

  return (
    <ol className="flex min-w-[13.5rem] items-center gap-0" aria-label={`Retry stage ${STEPS[current]?.label}`}>
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 flex-col items-center">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  done && "bg-brand-orange text-white",
                  active && "bg-brand-orange text-white ring-2 ring-brand-orange/30",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium leading-tight",
                  active || done ? "text-brand-ink" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn("mb-4 h-0.5 min-w-3 flex-1", i < current ? "bg-brand-orange" : "bg-border")}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
