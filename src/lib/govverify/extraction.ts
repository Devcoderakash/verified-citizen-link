/**
 * EXTRACTION LAYER (prototype)
 * ---------------------------------------------------------------
 * This layer is deliberately isolated so a real OCR / document-AI
 * engine can replace `extractDocument()` later without touching the
 * verification, cross-document or risk layers.
 *
 * In this prototype NO OCR is performed. Values are resolved from the
 * synthetic reference dataset using a deterministic mapping of the
 * uploaded file, or from a fixed demo scenario.
 */
import { supabase } from "@/integrations/supabase/client";
import type { DocumentRow, DocumentType, ExtractedDocument } from "./types";

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  documentType: DocumentType;
  personId: string;
  /** Deliberate difference between the "document" and the database record. */
  override?: Partial<Pick<ExtractedDocument, "dob" | "name" | "documentNumber">>;
  scenarioLabel: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "demo-aadhaar-genuine",
    title: "Demo Aadhaar — Genuine",
    subtitle: "All fields consistent with reference records",
    documentType: "AADHAAR",
    personId: "P001",
    scenarioLabel: "Genuine document",
  },
  {
    id: "demo-aadhaar-dob",
    title: "Demo Aadhaar — DOB Mismatch",
    subtitle: "Name and number match, date of birth differs",
    documentType: "AADHAAR",
    personId: "P003",
    override: { dob: "1972-12-15" },
    scenarioLabel: "Date of birth inconsistency",
  },
  {
    id: "demo-pan-crossdoc",
    title: "Demo PAN — Cross-document Conflict",
    subtitle: "Linked records hold different dates of birth",
    documentType: "PAN",
    personId: "P002",
    scenarioLabel: "Cross-document inconsistency",
  },
  {
    id: "demo-voter-genuine",
    title: "Demo Voter ID — Genuine",
    subtitle: "Electoral record consistent across documents",
    documentType: "VOTER_ID",
    personId: "P004",
    scenarioLabel: "Genuine document",
  },
  {
    id: "demo-dl-expired",
    title: "Demo Driving Licence — Expired",
    subtitle: "Holder verified, licence validity lapsed",
    documentType: "DRIVING_LICENCE",
    personId: "P005",
    scenarioLabel: "Expired document",
  },
  {
    id: "demo-dl-genuine",
    title: "Demo Driving Licence — Genuine",
    subtitle: "Valid licence, all fields consistent",
    documentType: "DRIVING_LICENCE",
    personId: "P006",
    scenarioLabel: "Genuine document",
  },
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const TYPES: DocumentType[] = ["AADHAAR", "PAN", "VOTER_ID", "DRIVING_LICENCE"];

/** Prototype "classification": filename hints first, deterministic fallback second. */
export function classifyDocument(fileName: string): DocumentType {
  const n = fileName.toLowerCase();
  if (n.includes("aadhaar") || n.includes("adhaar") || n.includes("uid")) return "AADHAAR";
  if (n.includes("pan")) return "PAN";
  if (n.includes("voter") || n.includes("epic")) return "VOTER_ID";
  if (n.includes("licence") || n.includes("license") || n.includes("dl")) return "DRIVING_LICENCE";
  const idx = hash(n) % TYPES.length;
  return TYPES[idx]!;
}

async function loadDocument(
  documentType: DocumentType,
  personId: string,
): Promise<DocumentRow | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("document_type", documentType)
    .eq("person_id", personId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as DocumentRow) ?? null;
}

async function pickDocumentForFile(
  documentType: DocumentType,
  fileName: string,
): Promise<DocumentRow | null> {
  // Explicit reference in the filename wins (e.g. "aadhaar_P042.png").
  const explicit = /p\d{3}/i.exec(fileName);
  if (explicit) {
    const found = await loadDocument(documentType, explicit[0].toUpperCase());
    if (found) return found;
  }
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("document_type", documentType)
    .order("document_id", { ascending: true })
    .limit(1000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as DocumentRow[];
  if (!rows.length) return null;
  return rows[hash(fileName) % rows.length]!;
}

function toExtracted(
  row: DocumentRow,
  method: ExtractedDocument["method"],
  sourceFileName: string,
  scenarioLabel?: string,
  override?: DemoScenario["override"],
): ExtractedDocument {
  return {
    documentType: row.document_type,
    name: override?.name ?? row.holder_name,
    dob: override?.dob ?? row.dob,
    documentNumber: override?.documentNumber ?? row.document_number,
    address: row.document_type === "PAN" ? null : row.address,
    gender: row.document_type === "PAN" ? null : row.gender,
    fatherName: row.document_type === "PAN" ? `${row.holder_name.split(" ").slice(-1)[0]} (guardian)` : null,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    method,
    sourceFileName,
    ...(scenarioLabel ? { scenarioLabel } : {}),
  };
}

export type ExtractionInput =
  | {
      kind: "upload";
      fileName: string;
      selectedType: DocumentType | "AUTO";
      imageDataUrl?: string | undefined;
    }
  | { kind: "demo"; scenarioId: string };

export interface ExtractionResult {
  extracted: ExtractedDocument;
  detectedType: DocumentType;
}

export async function extractDocument(input: ExtractionInput): Promise<ExtractionResult> {
  if (input.kind === "demo") {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === input.scenarioId);
    if (!scenario) throw new Error("Unknown demo document.");
    const row = await loadDocument(scenario.documentType, scenario.personId);
    if (!row) throw new Error("Demo record unavailable in the reference dataset.");
    return {
      detectedType: scenario.documentType,
      extracted: toExtracted(
        row,
        "DEMO_FIXTURE",
        `${scenario.title}.png`,
        scenario.scenarioLabel,
        scenario.override,
      ),
    };
  }

  if (!input.imageDataUrl) {
    throw new Error(
      "This file cannot be read. Please upload a clear photo or scan of the document (JPG or PNG).",
    );
  }

  const read = await readDocumentImage({
    data: { imageDataUrl: input.imageDataUrl, fileName: input.fileName },
  });

  const detectedType: DocumentType =
    input.selectedType !== "AUTO"
      ? input.selectedType
      : read.documentType !== "UNKNOWN"
        ? read.documentType
        : classifyDocument(input.fileName);

  if (!read.documentNumber || !read.name) {
    throw new Error(
      "The document number or name could not be read from this image. Please upload a clearer photo.",
    );
  }

  return {
    detectedType,
    extracted: {
      documentType: detectedType,
      name: read.name,
      dob: read.dob,
      documentNumber: read.documentNumber,
      address: read.address,
      gender: read.gender,
      fatherName: read.fatherName,
      issueDate: read.issueDate,
      expiryDate: read.expiryDate,
      method: "AI_READ",
      sourceFileName: input.fileName,
    },
  };
}
