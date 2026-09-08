/**
 * VERIFICATION LAYER
 * Compares extracted document values against the synthetic reference
 * database, checks the citizen's other identity records, and hands the
 * signals to the risk engine.
 */
import {
  findDocumentByNumber,
  getPerson,
  getPersonDocuments,
} from "./db";
import { calculateRisk } from "./risk";
import type {
  CrossDocumentEntry,
  DocumentRow,
  DocumentType,
  ExtractedDocument,
  FieldResult,
  MatchStatus,
  RiskReason,
  VerificationOutcome,
} from "./types";

const ALL_TYPES: DocumentType[] = ["AADHAAR", "PAN", "VOTER_ID", "DRIVING_LICENCE"];

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeNumber(value: string | null | undefined): string {
  return (value ?? "").replace(/[\s-]/g, "").toUpperCase();
}

/** Token-overlap similarity, tolerant of formatting differences. */
export function similarity(a: string, b: string): number {
  const at = normalizeText(a).split(" ").filter(Boolean);
  const bt = normalizeText(b).split(" ").filter(Boolean);
  if (!at.length || !bt.length) return 0;
  const bSet = new Set(bt);
  let hits = 0;
  for (const t of at) if (bSet.has(t)) hits++;
  return (2 * hits) / (at.length + bt.length);
}

function nameMatch(extracted: string, db: string): { status: MatchStatus; confidence: number } {
  if (normalizeText(extracted) === normalizeText(db)) return { status: "MATCH", confidence: 100 };
  const sim = similarity(extracted, db);
  if (sim >= 0.6) return { status: "PARTIAL_MATCH", confidence: Math.round(sim * 100) };
  return { status: "MISMATCH", confidence: Math.round(sim * 100) };
}

function addressMatch(extracted: string, db: string): { status: MatchStatus; confidence: number } {
  const sim = similarity(extracted, db);
  if (sim >= 0.9) return { status: "MATCH", confidence: Math.round(sim * 100) };
  if (sim >= 0.6) return { status: "PARTIAL_MATCH", confidence: Math.round(sim * 100) };
  return { status: "MISMATCH", confidence: Math.round(sim * 100) };
}

function newVerificationId(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GV-${stamp}-${rand}`;
}

export async function runVerification(
  extracted: ExtractedDocument,
): Promise<VerificationOutcome> {
  const verificationId = newVerificationId();
  const createdAt = new Date().toISOString();
  const dbDoc = await findDocumentByNumber(extracted.documentType, extracted.documentNumber);

  if (!dbDoc) {
    const fields: FieldResult[] = [
      {
        field_name: "Document Number",
        extracted_value: extracted.documentNumber,
        database_value: null,
        match_status: "NOT_AVAILABLE",
        confidence: null,
      },
      {
        field_name: "Name",
        extracted_value: extracted.name,
        database_value: null,
        match_status: "NOT_AVAILABLE",
        confidence: null,
      },
    ];
    return {
      verificationId,
      personId: null,
      documentId: null,
      documentType: extracted.documentType,
      citizenName: extracted.name,
      extracted,
      databaseDocument: null,
      person: null,
      fields,
      crossDocuments: [],
      riskReasons: [
        {
          code: "NO_RECORD",
          label: "No matching identity record",
          weight: 40,
          detail: "The document number was not found in the available synthetic records.",
        },
      ],
      riskScore: 40,
      riskLevel: "MEDIUM",
      verificationStatus: "NO_RECORD",
      faceMatch: "NOT_AVAILABLE",
      tamperIndicator: "NOT_AVAILABLE",
      decision:
        "Unable to verify against available records. Manual verification recommended — this outcome does not indicate fraud.",
      createdAt,
    };
  }

  const person = await getPerson(dbDoc.person_id);
  const personDocs = await getPersonDocuments(dbDoc.person_id);

  const fields: FieldResult[] = [];

  const nm = nameMatch(extracted.name, dbDoc.holder_name);
  fields.push({
    field_name: "Name",
    extracted_value: extracted.name,
    database_value: dbDoc.holder_name,
    match_status: nm.status,
    confidence: nm.confidence,
  });

  const dobStatus: MatchStatus =
    !extracted.dob || !dbDoc.dob ? "NOT_AVAILABLE" : extracted.dob === dbDoc.dob ? "MATCH" : "MISMATCH";
  fields.push({
    field_name: "Date of Birth",
    extracted_value: extracted.dob,
    database_value: dbDoc.dob,
    match_status: dobStatus,
    confidence: dobStatus === "MATCH" ? 100 : dobStatus === "MISMATCH" ? 0 : null,
  });

  const numStatus: MatchStatus =
    normalizeNumber(extracted.documentNumber) === normalizeNumber(dbDoc.document_number)
      ? "MATCH"
      : "MISMATCH";
  fields.push({
    field_name: "Document Number",
    extracted_value: extracted.documentNumber,
    database_value: dbDoc.document_number,
    match_status: numStatus,
    confidence: numStatus === "MATCH" ? 100 : 0,
  });

  if (extracted.address && dbDoc.address) {
    const am = addressMatch(extracted.address, dbDoc.address);
    fields.push({
      field_name: "Address",
      extracted_value: extracted.address,
      database_value: dbDoc.address,
      match_status: am.status,
      confidence: am.confidence,
    });
  } else {
    fields.push({
      field_name: "Address",
      extracted_value: extracted.address,
      database_value: dbDoc.address,
      match_status: "NOT_AVAILABLE",
      confidence: null,
    });
  }

  if (extracted.gender && dbDoc.gender) {
    fields.push({
      field_name: "Gender",
      extracted_value: extracted.gender,
      database_value: dbDoc.gender,
      match_status:
        normalizeText(extracted.gender) === normalizeText(dbDoc.gender) ? "MATCH" : "MISMATCH",
      confidence: normalizeText(extracted.gender) === normalizeText(dbDoc.gender) ? 100 : 0,
    });
  }

  fields.push({
    field_name: "Document Status",
    extracted_value: null,
    database_value: dbDoc.status,
    match_status: dbDoc.status.toUpperCase() === "ACTIVE" ? "MATCH" : "MISMATCH",
    confidence: dbDoc.status.toUpperCase() === "ACTIVE" ? 100 : 0,
  });

  let expired = false;
  if (dbDoc.expiry_date) {
    expired = new Date(dbDoc.expiry_date).getTime() < Date.now();
    fields.push({
      field_name: "Expiry Date",
      extracted_value: extracted.expiryDate,
      database_value: dbDoc.expiry_date,
      match_status: expired ? "MISMATCH" : "MATCH",
      confidence: expired ? 0 : 100,
    });
  }

  // ---- Cross-document identity check -------------------------------
  const crossDocuments: CrossDocumentEntry[] = ALL_TYPES.map((type) => {
    const doc = personDocs.find((d) => d.document_type === type);
    if (!doc) {
      return {
        documentType: type,
        documentNumber: "",
        status: "NOT_AVAILABLE",
        present: false,
        consistent: false,
        issues: ["No linked record available"],
      };
    }
    const issues: string[] = [];
    if (person) {
      if (doc.dob && person.dob && doc.dob !== person.dob) {
        issues.push(`Date of birth differs (${doc.dob} vs ${person.dob})`);
      }
      if (similarity(doc.holder_name, person.name) < 0.9) {
        issues.push("Name differs from primary identity record");
      }
    }
    if (doc.expiry_date && new Date(doc.expiry_date).getTime() < Date.now()) {
      issues.push("Document has expired");
    }
    if (doc.status.toUpperCase() !== "ACTIVE") {
      issues.push(`Record status: ${doc.status}`);
    }
    return {
      documentType: type,
      documentNumber: doc.document_number,
      status: doc.status,
      present: true,
      consistent: issues.length === 0,
      issues,
      expiryDate: doc.expiry_date,
    };
  });

  const crossConflicts = crossDocuments.filter((c) => c.present && !c.consistent);

  // ---- Risk engine --------------------------------------------------
  const risk = calculateRisk({
    nameStatus: nm.status,
    dobStatus,
    numberStatus: numStatus,
    addressStatus: fields.find((f) => f.field_name === "Address")?.match_status ?? "NOT_AVAILABLE",
    expired,
    crossConflicts: crossConflicts.map((c) => ({
      documentType: c.documentType,
      issues: c.issues,
    })),
  });

  const verificationStatus =
    risk.level === "LOW"
      ? "VERIFIED"
      : risk.level === "HIGH" || risk.level === "CRITICAL"
        ? "HIGH_RISK"
        : "REVIEW_REQUIRED";


  const decision =
    verificationStatus === "VERIFIED"
      ? "Identity information is consistent with the available synthetic verification records."
      : verificationStatus === "HIGH_RISK"
        ? "Significant verification inconsistencies detected. Manual review by a senior officer is recommended before any decision."
        : "Verification inconsistency detected. Manual review recommended before accepting this document.";

  const riskReasons: RiskReason[] = risk.reasons;

  return {
    verificationId,
    personId: dbDoc.person_id,
    documentId: dbDoc.document_id,
    documentType: extracted.documentType,
    citizenName: dbDoc.holder_name,
    extracted,
    databaseDocument: dbDoc,
    person,
    fields,
    crossDocuments,
    riskReasons,
    riskScore: risk.score,
    riskLevel: risk.level,
    verificationStatus,
    faceMatch: "NOT_AVAILABLE",
    tamperIndicator: "NOT_AVAILABLE",
    decision,
    createdAt,
  };
}

export type { DocumentRow };
