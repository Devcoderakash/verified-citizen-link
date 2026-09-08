export type DocumentType = "AADHAAR" | "PAN" | "VOTER_ID" | "DRIVING_LICENCE";

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  AADHAAR: "Aadhaar Card",
  PAN: "PAN Card",
  VOTER_ID: "Voter ID (EPIC)",
  DRIVING_LICENCE: "Driving Licence",
};

export const DOCUMENT_SHORT: Record<DocumentType, string> = {
  AADHAAR: "Aadhaar",
  PAN: "PAN",
  VOTER_ID: "Voter ID",
  DRIVING_LICENCE: "Driving Licence",
};

export type MatchStatus = "MATCH" | "PARTIAL_MATCH" | "MISMATCH" | "NOT_AVAILABLE";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type VerificationStatus = "VERIFIED" | "REVIEW_REQUIRED" | "HIGH_RISK" | "NO_RECORD";

/** Output of the extraction layer. A real OCR engine can replace this later. */
export interface ExtractedDocument {
  documentType: DocumentType;
  name: string;
  dob: string | null; // ISO yyyy-mm-dd
  documentNumber: string;
  address: string | null;
  gender: string | null;
  fatherName: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  /** How these values were obtained — prototype only, never real OCR. */
  method: "DEMO_FIXTURE" | "PROTOTYPE_MAPPING" | "AI_READ";
  sourceFileName: string;
  scenarioLabel?: string;
}

export interface PersonRow {
  person_id: string;
  name: string;
  dob: string;
  gender: string | null;
  address: string | null;
}

export interface DocumentRow {
  document_id: string;
  person_id: string;
  document_type: DocumentType;
  document_number: string;
  holder_name: string;
  dob: string | null;
  gender: string | null;
  address: string | null;
  status: string;
  issue_date: string | null;
  expiry_date: string | null;
}

export interface FieldResult {
  field_name: string;
  extracted_value: string | null;
  database_value: string | null;
  match_status: MatchStatus;
  confidence: number | null;
}

export interface CrossDocumentEntry {
  documentType: DocumentType;
  documentNumber: string;
  status: string;
  present: boolean;
  consistent: boolean;
  issues: string[];
  expiryDate?: string | null;
}

export interface RiskReason {
  code: string;
  label: string;
  weight: number;
  detail?: string;
}

export interface VerificationOutcome {
  verificationId: string;
  personId: string | null;
  documentId: string | null;
  documentType: DocumentType;
  citizenName: string | null;
  extracted: ExtractedDocument;
  databaseDocument: DocumentRow | null;
  person: PersonRow | null;
  fields: FieldResult[];
  crossDocuments: CrossDocumentEntry[];
  riskReasons: RiskReason[];
  riskScore: number;
  riskLevel: RiskLevel;
  verificationStatus: VerificationStatus;
  faceMatch: "NOT_AVAILABLE";
  tamperIndicator: "NOT_AVAILABLE";
  decision: string;
  createdAt: string;
}

export interface VerificationRecordRow {
  verification_id: string;
  person_id: string | null;
  document_id: string | null;
  document_type: DocumentType;
  citizen_name: string | null;
  officer_name: string | null;
  source_file_name: string | null;
  extracted: ExtractedDocument;
  cross_documents: CrossDocumentEntry[];
  risk_reasons: RiskReason[];
  name_match: MatchStatus | null;
  dob_match: MatchStatus | null;
  address_match: MatchStatus | null;
  document_number_match: MatchStatus | null;
  status_match: MatchStatus | null;
  expiry_valid: string | null;
  face_match: string;
  tamper_indicator: string;
  risk_score: number;
  risk_level: RiskLevel;
  verification_status: VerificationStatus;
  created_at: string;
}
