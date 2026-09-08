import type { DocumentType, MatchStatus, RiskLevel, VerificationStatus } from "./types";

/** Mask sensitive identity numbers — only the last 4 characters stay visible. */
export function maskNumber(type: DocumentType, value: string | null | undefined): string {
  if (!value) return "—";
  const raw = value.replace(/\s|-/g, "");
  if (raw.length <= 4) return raw;
  const tail = raw.slice(-4);
  switch (type) {
    case "AADHAAR":
      return `XXXX XXXX ${tail}`;
    case "PAN":
      return `XXXXXX${tail}`;
    case "VOTER_ID":
      return `XXXXXX${tail}`;
    case "DRIVING_LICENCE":
      return `DL-XX-XXXXXXXX${tail}`;
    default:
      return `XXXX${tail}`;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const MATCH_LABEL: Record<MatchStatus, string> = {
  MATCH: "Match",
  PARTIAL_MATCH: "Partial match",
  MISMATCH: "Mismatch",
  NOT_AVAILABLE: "Not available",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "Low risk",
  MEDIUM: "Medium risk",
  HIGH: "High risk",
  CRITICAL: "Critical risk",
};

export const STATUS_LABEL: Record<VerificationStatus, string> = {
  VERIFIED: "Verified",
  REVIEW_REQUIRED: "Manual review required",
  HIGH_RISK: "High risk — review required",
  NO_RECORD: "No matching record",
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
