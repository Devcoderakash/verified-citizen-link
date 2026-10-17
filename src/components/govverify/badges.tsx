import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  MinusCircle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MATCH_LABEL, RISK_LABEL, STATUS_LABEL } from "@/lib/govverify/format";
import type { MatchStatus, RiskLevel, VerificationStatus } from "@/lib/govverify/types";

const base =
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-tight whitespace-nowrap";

export function MatchBadge({ status }: { status: MatchStatus }) {
  const map: Record<MatchStatus, string> = {
    MATCH: "border-success/30 bg-success-soft text-success",
    PARTIAL_MATCH: "border-warning/30 bg-warning-soft text-warning",
    MISMATCH: "border-danger/30 bg-danger-soft text-danger",
    NOT_AVAILABLE: "border-border bg-muted text-muted-foreground",
  };
  const Icon =
    status === "MATCH"
      ? CheckCircle2
      : status === "PARTIAL_MATCH"
        ? AlertTriangle
        : status === "MISMATCH"
          ? CircleSlash
          : MinusCircle;
  return (
    <span className={cn(base, map[status])}>
      <Icon className="size-3.5" aria-hidden />
      {MATCH_LABEL[status]}
    </span>
  );
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const map: Record<RiskLevel, string> = {
    LOW: "border-success/30 bg-success-soft text-success",
    MEDIUM: "border-warning/30 bg-warning-soft text-warning",
    HIGH: "border-danger/40 bg-danger-soft text-danger",
    CRITICAL: "border-danger bg-danger text-danger-foreground",
  };
  return (
    <span className={cn(base, map[level])}>
      {level === "LOW" ? (
        <ShieldCheck className="size-3.5" />
      ) : (
        <ShieldAlert className="size-3.5" />
      )}
      {RISK_LABEL[level]}
      {typeof score === "number" ? ` · ${score}` : ""}
    </span>
  );
}

export function StatusBadge({ status }: { status: VerificationStatus }) {
  const map: Record<VerificationStatus, string> = {
    VERIFIED: "border-success/30 bg-success-soft text-success",
    REVIEW_REQUIRED: "border-warning/40 bg-warning-soft text-warning",
    HIGH_RISK: "border-danger/40 bg-danger-soft text-danger",
    NO_RECORD: "border-border bg-muted text-muted-foreground",
  };
  const Icon =
    status === "VERIFIED" ? CheckCircle2 : status === "NO_RECORD" ? MinusCircle : AlertTriangle;
  return (
    <span className={cn(base, map[status])}>
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
