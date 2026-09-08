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
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            {Icon ? (
              <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-info-soft text-primary">
                <Icon className="size-4" />
              </span>
            ) : null}
            <div>
              <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
              {description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              ) : null}
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
    neutral: "bg-info-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  } as const;
  return (
    <div className="panel gv-rise p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn("flex size-10 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
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
    <div className="flex flex-col gap-0.5 border-b border-border/70 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className={cn("text-sm font-medium", mono && "font-mono tracking-wide")}>{value}</span>
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
