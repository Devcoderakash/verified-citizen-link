import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  icon: Icon,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-4 border-b border-border/80 bg-secondary/15 px-5 py-3.5">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-border">
                <Icon className="size-3.5" />
              </span>
            ) : null}
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
              {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
            </div>
          </div>
          {actions}
        </header>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "danger";
  hint?: string;
}) {
  const tones = {
    neutral: "bg-primary/10 text-primary ring-border",
    success: "bg-success-soft text-success ring-success/30",
    warning: "bg-warning-soft text-warning ring-warning/30",
    danger: "bg-danger-soft text-danger ring-danger/30",
  } as const;
  return (
    <div className="group panel gv-rise p-5 transition-all hover:border-primary/40 hover:shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {value}
          </p>
          {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-105",
            tones[tone],
          )}
        >
          <Icon className="size-4.5" />
        </span>
      </div>
    </div>
  );
}

export function FieldRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 px-1 py-2.5 transition-colors hover:bg-secondary/20 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-medium text-foreground sm:text-sm",
          mono && "font-mono font-semibold tracking-wide",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
