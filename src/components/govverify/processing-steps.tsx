import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const PROCESSING_STEPS = [
  "Document uploaded & validated",
  "Image greyscale & contrast preprocessing",
  "Neural OCR recognition (Tesseract.js)",
  "Parsing citizen identity fields",
  "Reconciling with synthetic reference registry",
  "Cross-document consistency check",
  "Calculating weighted risk assessment",
] as const;

export function ProcessingSteps({
  current,
  ocrProgress,
  ocrStatus,
}: {
  current: number;
  ocrProgress?: number | undefined;
  ocrStatus?: string | undefined;
}) {
  const pct = Math.round(
    (Math.min(current, PROCESSING_STEPS.length) / PROCESSING_STEPS.length) * 100,
  );
  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Inspection Pipeline Execution</span>
          <span className="font-mono font-semibold tabular-nums text-foreground">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <ol className="space-y-2.5">
        {PROCESSING_STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const isOcrStep = i === 2;
          return (
            <li
              key={step}
              className={cn(
                "rounded-md border px-3.5 py-2.5 text-xs sm:text-sm transition-colors",
                done
                  ? "border-success/30 bg-success-soft/50 text-foreground"
                  : active
                    ? "border-primary/40 bg-primary/5 text-foreground ring-1 ring-primary/20"
                    : "border-border/80 bg-card text-muted-foreground",
              )}
            >
              <div className="flex items-center gap-3">
                {done ? (
                  <Check className="size-4 text-success" />
                ) : active ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <Circle className="size-4" />
                )}
                <span className={cn(active && "font-medium")}>{step}</span>
                {isOcrStep && active && typeof ocrProgress === "number" ? (
                  <span className="ml-auto tabular-nums text-xs text-primary">
                    {Math.round(ocrProgress * 100)}%
                  </span>
                ) : null}
              </div>
              {isOcrStep && active ? (
                <div className="mt-3 pl-7">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-200"
                      style={{ width: `${Math.round((ocrProgress ?? 0) * 100)}%` }}
                    />
                  </div>
                  {ocrStatus ? (
                    <p className="mt-2 text-xs text-muted-foreground capitalize">{ocrStatus}</p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
