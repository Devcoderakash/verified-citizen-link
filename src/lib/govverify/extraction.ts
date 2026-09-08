/**
 * EXTRACTION LAYER
 * ---------------------------------------------------------------
 * Real OCR (Tesseract.js) reads the uploaded image; the parser turns that
 * text into fields. No filename mapping, no database substitution and no
 * hardcoded person is used anywhere in this layer.
 */
import { supabase } from "@/integrations/supabase/client";
import { classifyFromText } from "./documentClassifier";
import { parseDocument } from "./documentParser";
import type { OcrResult } from "./ocr";
import type { DocumentRow, DocumentType, ExtractedDocument } from "./types";

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  documentType: DocumentType;
  /** Which synthetic record the demo IMAGE is drawn from — the image is then
   *  read by real OCR exactly like any upload. */
  personId: string;
  /** Deliberate difference printed on the demo image (forgery simulation). */
  printedOverride?: { dob?: string; name?: string };
  scenarioLabel: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "demo-aadhaar-genuine",
    title: "Demo Aadhaar — Genuine",
    subtitle: "Image printed from a reference record, read by OCR",
    documentType: "AADHAAR",
    personId: "P001",
    scenarioLabel: "Genuine document",
  },
  {
    id: "demo-aadhaar-dob",
    title: "Demo Aadhaar — Altered date of birth",
    subtitle: "Same holder, printed date of birth changed",
    documentType: "AADHAAR",
    personId: "P001",
    printedOverride: { dob: "1987-12-15" },
    scenarioLabel: "Date of birth inconsistency",
  },
  {
    id: "demo-pan-genuine",
    title: "Demo PAN — Genuine",
    subtitle: "PAN card image generated from a reference record",
    documentType: "PAN",
    personId: "P002",
    scenarioLabel: "Genuine document",
  },
  {
    id: "demo-voter-genuine",
    title: "Demo Voter ID — Genuine",
    subtitle: "Electoral card image generated from a reference record",
    documentType: "VOTER_ID",
    personId: "P004",
    scenarioLabel: "Genuine document",
  },
  {
    id: "demo-dl-expired",
    title: "Demo Driving Licence — Expired",
    subtitle: "Holder exists, licence validity lapsed",
    documentType: "DRIVING_LICENCE",
    personId: "P005",
    scenarioLabel: "Expired document",
  },
  {
    id: "demo-unknown-person",
    title: "Demo Aadhaar — Unknown person",
    subtitle: "Holder not present in the reference records",
    documentType: "AADHAAR",
    personId: "__UNKNOWN__",
    scenarioLabel: "No reference record",
  },
];

export async function loadDemoRow(scenario: DemoScenario): Promise<DocumentRow | null> {
  if (scenario.personId === "__UNKNOWN__") return null;
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("document_type", scenario.documentType)
    .eq("person_id", scenario.personId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as DocumentRow) ?? null;
}

export class OcrFieldError extends Error {
  constructor(
    message: string,
    public readonly missing: string[],
  ) {
    super(message);
    this.name = "OcrFieldError";
  }
}

export interface ExtractionResult {
  extracted: ExtractedDocument;
  detectedType: DocumentType;
  typeConfidence: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * Build the structured document from a real OCR result.
 * `selectedType` is the officer's manual override ("AUTO" = detect from text).
 */
export function extractFromOcr(
  ocr: OcrResult,
  selectedType: DocumentType | "AUTO",
  sourceFileName: string,
  scenarioLabel?: string,
): ExtractionResult {
  const classification = classifyFromText(ocr.text);
  const detectedType = selectedType === "AUTO" ? classification.documentType : selectedType;

  if (!detectedType) {
    throw new OcrFieldError(
      "Document type could not be determined from the scanned text. Please select the document type manually and try again.",
      ["Document Type"],
    );
  }

  const parsed = parseDocument(detectedType, ocr.text);

  if (!parsed.name || !parsed.documentNumber) {
    throw new OcrFieldError(
      `OCR could not read ${parsed.missing.join(", ")} from this image. Please upload a clearer photo or scan.`,
      parsed.missing,
    );
  }

  return {
    detectedType,
    typeConfidence: selectedType === "AUTO" ? classification.confidence : "HIGH",
    extracted: {
      documentType: detectedType,
      name: parsed.name,
      dob: parsed.dob,
      documentNumber: parsed.documentNumber,
      address: parsed.address,
      gender: parsed.gender,
      fatherName: parsed.fatherName,
      issueDate: parsed.issueDate,
      expiryDate: parsed.expiryDate,
      method: "OCR_TESSERACT",
      sourceFileName,
      ocrText: ocr.text,
      ocrConfidence: ocr.confidence,
      ocrDurationMs: ocr.durationMs,
      typeDetection:
        selectedType === "AUTO"
          ? { source: "OCR_TEXT", confidence: classification.confidence, indicators: classification.matchedIndicators }
          : { source: "MANUAL", confidence: "HIGH", indicators: [] },
      missingFields: parsed.missing,
      ...(scenarioLabel ? { scenarioLabel } : {}),
    },
  };
}
