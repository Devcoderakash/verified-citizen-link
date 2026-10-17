import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleSlash,
  Clock,
  FileWarning,
  MinusCircle,
  ShieldQuestion,
} from "lucide-react";
import { MatchBadge, RiskBadge } from "./badges";
import { Panel } from "./panels";
import { formatDate, maskNumber } from "@/lib/govverify/format";
import { UNAVAILABLE_SIGNALS } from "@/lib/govverify/risk";
import {
  DOCUMENT_SHORT,
  type CrossDocumentEntry,
  type DocumentType,
  type FieldResult,
  type RiskLevel,
  type RiskReason,
} from "@/lib/govverify/types";
import { cn } from "@/lib/utils";

const SENSITIVE_FIELDS = new Set(["Document Number"]);

export function FieldComparison({
  fields,
  documentType,
}: {
  fields: FieldResult[];
  documentType: DocumentType;
}) {
  if (!fields.length) {
    return <p className="text-sm text-muted-foreground">No comparable fields were available.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border/80 bg-secondary/20 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <th className="px-4 py-3">Credential Field</th>
            <th className="px-4 py-3">Extracted via OCR</th>
            <th className="px-4 py-3">Reference Record</th>
            <th className="px-4 py-3">Verification State</th>
            <th className="px-4 py-3 text-right">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {fields.map((f) => {
            const mask = SENSITIVE_FIELDS.has(f.field_name);
            const show = (v: string | null) =>
              v ? (mask ? maskNumber(documentType, v) : isDate(v) ? formatDate(v) : v) : "—";
            return (
              <tr key={f.field_name} className="transition-colors hover:bg-secondary/20">
                <td className="px-4 py-3 font-semibold text-foreground">{f.field_name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="font-mono text-xs">{show(f.extracted_value)}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="font-mono text-xs">{show(f.database_value)}</span>
                </td>
                <td className="px-4 py-3">
                  <MatchBadge status={f.match_status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {f.confidence === null ? (
                    <span className="text-muted-foreground/60">—</span>
                  ) : (
                    <span className="font-semibold text-foreground">
                      {Math.round(Number(f.confidence))}%
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function isDate(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function CrossDocumentCard({ entries }: { entries: CrossDocumentEntry[] }) {
  if (!entries.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No linked identity records could be reviewed for this verification.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <div
            key={entry.documentType}
            className={cn(
              "rounded-xl border px-4 py-3",
              !entry.present
                ? "border-border bg-muted/40"
                : entry.consistent
                  ? "border-success/25 bg-success-soft/60"
                  : "border-warning/40 bg-warning-soft/70",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{DOCUMENT_SHORT[entry.documentType]}</p>
              {!entry.present ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MinusCircle className="size-3.5" /> Not available
                </span>
              ) : entry.consistent ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <CheckCircle2 className="size-3.5" /> Consistent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
                  <AlertTriangle className="size-3.5" /> Conflict
                </span>
              )}
            </div>
            {entry.present ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {maskNumber(entry.documentType, entry.documentNumber)}
                {entry.expiryDate ? ` · valid to ${formatDate(entry.expiryDate)}` : ""}
              </p>
            ) : null}
            {entry.issues.length && entry.present ? (
              <ul className="mt-2 space-y-1 text-xs text-warning">
                {entry.issues.map((issue) => (
                  <li key={issue}>• {issue}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RiskScoreCard({
  score,
  level,
  reasons,
}: {
  score: number;
  level: RiskLevel;
  reasons: RiskReason[];
}) {
  const tone =
    level === "LOW" ? "text-success" : level === "MEDIUM" ? "text-warning" : "text-danger";
  const bar = level === "LOW" ? "bg-success" : level === "MEDIUM" ? "bg-warning" : "bg-danger";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className={cn("text-5xl font-semibold tabular-nums tracking-tight", tone)}>{score}</p>
          <p className="text-xs text-muted-foreground">out of 100</p>
        </div>
        <RiskBadge level={level} />
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", bar)}
          style={{ width: `${score}%` }}
        />
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Contributing signals
        </p>
        {reasons.length ? (
          <ul className="mt-2 space-y-2">
            {reasons.map((r, i) => (
              <li
                key={`${r.code}-${i}`}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm"
              >
                <span>
                  {r.label}
                  {r.detail ? (
                    <span className="block text-xs text-muted-foreground">{r.detail}</span>
                  ) : null}
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  +{r.weight}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 flex items-center gap-2 rounded-lg border border-success/25 bg-success-soft/60 px-3 py-2 text-sm text-success">
            <CheckCircle2 className="size-4" /> No risk signals were raised.
          </p>
        )}
      </div>
      <div className="rounded-lg border border-dashed border-border px-3 py-3">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <ShieldQuestion className="size-3.5" /> Signals not implemented in this prototype
        </p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {UNAVAILABLE_SIGNALS.map((s) => (
            <li key={s.code} className="flex items-center justify-between gap-3">
              <span>{s.label}</span>
              <span className="inline-flex items-center gap-1.5">
                <CircleSlash className="size-3.5" /> Not available
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">
        Prototype heuristic score based on weighted field signals. It is not an official government
        fraud probability.
      </p>
    </div>
  );
}

export function Timeline({
  events,
}: {
  events: { event_type: string; description: string | null; created_at: string }[];
}) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No timeline entries recorded.</p>;
  }
  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {events.map((e, i) => (
        <li key={`${e.event_type}-${i}`} className="relative">
          <span className="absolute -left-[31px] flex size-4 items-center justify-center rounded-full border-2 border-card bg-primary" />
          <p className="text-sm font-medium capitalize">
            {e.event_type.toLowerCase().replace(/_/g, " ")}
          </p>
          {e.description ? <p className="text-sm text-muted-foreground">{e.description}</p> : null}
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {new Date(e.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function DecisionBanner({
  status,
  decision,
}: {
  status: "VERIFIED" | "REVIEW_REQUIRED" | "HIGH_RISK" | "NO_RECORD";
  decision: string;
}) {
  const config = {
    VERIFIED: {
      title: "Identity Verified — Compliant with Reference Record",
      badge: "VERIFIED",
      className: "border-success/40 bg-success-soft text-success",
      Icon: CheckCircle2,
    },
    REVIEW_REQUIRED: {
      title: "Manual Inspection Advised — Discrepancies Noted",
      badge: "AUDIT REQUIRED",
      className: "border-warning/50 bg-warning-soft text-warning",
      Icon: AlertTriangle,
    },
    HIGH_RISK: {
      title: "Elevated Risk Flag — Inconsistencies Detected",
      badge: "HIGH RISK",
      className: "border-danger/50 bg-danger-soft text-danger",
      Icon: FileWarning,
    },
    NO_RECORD: {
      title: "No Matching Citizen Record in Synthetic Registry",
      badge: "UNREGISTERED",
      className: "border-border bg-secondary text-foreground",
      Icon: ShieldQuestion,
    },
  }[status];

  return (
    <div
      className={cn(
        "gv-rise flex items-start gap-4 rounded-lg border p-4 sm:p-5 shadow-2xs",
        config.className,
      )}
    >
      <config.Icon className="mt-0.5 size-6 shrink-0" />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-bold tracking-tight">{config.title}</p>
          <span className="rounded border border-current/30 px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase">
            {config.badge}
          </span>
        </div>
        <p className="mt-1 text-xs sm:text-sm opacity-90 leading-relaxed">{decision}</p>
      </div>
      <ArrowRight className="ml-auto hidden size-5 opacity-40 sm:block" />
    </div>
  );
}
