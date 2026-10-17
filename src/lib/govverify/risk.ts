/**
 * RISK ENGINE (transparent prototype heuristic)
 * This is NOT an official fraud probability. Weighted signals only.
 */
import type { DocumentType, MatchStatus, RiskLevel, RiskReason } from "./types";

export const RISK_WEIGHTS = {
  NAME_MISMATCH: 45,
  DOB_MISMATCH: 45,
  NUMBER_MISMATCH: 20,
  ADDRESS_MISMATCH: 10,
  EXPIRED_DOCUMENT: 20,
  CROSS_DOCUMENT_CONFLICT: 20,
  TAMPER_INDICATOR: 30,
  FACE_MISMATCH: 30,
} as const;

export interface RiskInput {
  nameStatus: MatchStatus;
  dobStatus: MatchStatus;
  numberStatus: MatchStatus;
  addressStatus: MatchStatus;
  expired: boolean;
  crossConflicts: { documentType: DocumentType; issues: string[] }[];
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  reasons: RiskReason[];
}

export function riskLevelFor(score: number): RiskLevel {
  if (score <= 10) return "LOW";
  if (score <= 40) return "MEDIUM";
  if (score <= 70) return "HIGH";
  return "CRITICAL";
}

export function calculateRisk(input: RiskInput): RiskResult {
  const reasons: RiskReason[] = [];

  if (input.nameStatus === "MISMATCH") {
    reasons.push({
      code: "NAME_MISMATCH",
      label: "Name mismatch",
      weight: RISK_WEIGHTS.NAME_MISMATCH,
    });
  } else if (input.nameStatus === "PARTIAL_MATCH") {
    reasons.push({
      code: "NAME_PARTIAL",
      label: "Name partially matches record",
      weight: Math.round(RISK_WEIGHTS.NAME_MISMATCH / 2),
    });
  }
  if (input.dobStatus === "MISMATCH") {
    reasons.push({
      code: "DOB_MISMATCH",
      label: "Date of birth mismatch",
      weight: RISK_WEIGHTS.DOB_MISMATCH,
    });
  }
  if (input.numberStatus === "MISMATCH") {
    reasons.push({
      code: "NUMBER_MISMATCH",
      label: "Document number mismatch",
      weight: RISK_WEIGHTS.NUMBER_MISMATCH,
    });
  }
  if (input.addressStatus === "MISMATCH") {
    reasons.push({
      code: "ADDRESS_MISMATCH",
      label: "Address mismatch",
      weight: RISK_WEIGHTS.ADDRESS_MISMATCH,
    });
  } else if (input.addressStatus === "PARTIAL_MATCH") {
    reasons.push({
      code: "ADDRESS_PARTIAL",
      label: "Address partially matches record",
      weight: Math.round(RISK_WEIGHTS.ADDRESS_MISMATCH / 2),
    });
  }
  if (input.expired) {
    reasons.push({
      code: "EXPIRED_DOCUMENT",
      label: "Document validity expired",
      weight: RISK_WEIGHTS.EXPIRED_DOCUMENT,
    });
  }
  for (const conflict of input.crossConflicts) {
    reasons.push({
      code: "CROSS_DOCUMENT_CONFLICT",
      label: `Cross-document inconsistency (${conflict.documentType.replace("_", " ").toLowerCase()})`,
      weight: RISK_WEIGHTS.CROSS_DOCUMENT_CONFLICT,
      detail: conflict.issues.join("; "),
    });
  }

  const raw = reasons.reduce((sum, r) => sum + r.weight, 0);
  const score = Math.max(0, Math.min(100, raw));
  return { score, level: riskLevelFor(score), reasons };
}

/** Capabilities that are intentionally NOT implemented in this prototype. */
export const UNAVAILABLE_SIGNALS = [
  {
    code: "FACE_MATCH",
    label: "Face verification",
    weight: RISK_WEIGHTS.FACE_MISMATCH,
    note: "Not available — no biometric capability in this prototype.",
  },
  {
    code: "TAMPER_INDICATOR",
    label: "Tamper / forgery detection",
    weight: RISK_WEIGHTS.TAMPER_INDICATOR,
    note: "Not available — no image forensics in this prototype.",
  },
];
