/**
 * DOCUMENT CLASSIFIER — decides the document type from the OCR text only.
 * Filenames are never used to pick a person or a database record.
 */
import type { DocumentType } from "./types";

export interface ClassificationResult {
  documentType: DocumentType | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  matchedIndicators: string[];
}

const INDICATORS: Record<DocumentType, string[]> = {
  AADHAAR: [
    "unique identification authority",
    "uidai",
    "aadhaar",
    "aadhar",
    "government of india",
    "मेरा आधार",
    "भारत सरकार",
  ],
  PAN: ["income tax department", "permanent account number", "pan card", "आयकर विभाग"],
  VOTER_ID: [
    "election commission of india",
    "elector photo identity card",
    "epic",
    "voter",
    "निर्वाचन आयोग",
  ],
  DRIVING_LICENCE: [
    "driving licence",
    "driving license",
    "transport department",
    "date of issue",
    "cov",
    "dl no",
  ],
};

const TYPES = Object.keys(INDICATORS) as DocumentType[];

export function classifyFromText(rawText: string): ClassificationResult {
  const text = rawText.toLowerCase();
  let best: DocumentType | null = null;
  let bestHits: string[] = [];

  for (const type of TYPES) {
    const hits = INDICATORS[type].filter((k) => text.includes(k));
    // "Government of India" alone is too weak to decide.
    const weight = hits.filter((h) => h !== "government of india").length;
    const bestWeight = bestHits.filter((h) => h !== "government of india").length;
    if (weight > bestWeight || (best === null && hits.length > 0)) {
      best = type;
      bestHits = hits;
    }
  }

  const strong = bestHits.filter((h) => h !== "government of india").length;
  if (!best || strong === 0) {
    return { documentType: null, confidence: "LOW", matchedIndicators: bestHits };
  }
  return {
    documentType: best,
    confidence: strong >= 2 ? "HIGH" : "MEDIUM",
    matchedIndicators: bestHits,
  };
}
