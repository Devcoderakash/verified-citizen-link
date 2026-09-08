import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const PROCESSING_STEPS = [
  "Document uploaded",
  "Document type identified",
  "Extracting information",
  "Searching verification records",
  "Cross-document verification",
  "Calculating risk score",
] as const;

export function ProcessingSteps({ current }: { current: number }) {
  const pct = Math.round((Math.min(current, PROCESSING_STEPS.length) / PROCESSING_STEPS.length) * 100);
  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Verification pipeline</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <ol className="space-y-3">
        {PROCESSING_STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                done
                  ? "border-success/25 bg-success-soft/60 text-foreground"
                  : active
                    ? "border-primary/30 bg-info-soft text-foreground"
                    : "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-4 text-success" />
              ) : active ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <Circle className="size-4" />
              )}
              <span className={cn(active && "font-medium")}>{step}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
