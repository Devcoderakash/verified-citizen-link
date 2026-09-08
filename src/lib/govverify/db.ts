import { supabase } from "@/integrations/supabase/client";
import type {
  DocumentRow,
  DocumentType,
  PersonRow,
  VerificationOutcome,
  VerificationRecordRow,
} from "./types";

function normalizeNumber(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export async function findDocumentByNumber(
  documentType: DocumentType,
  documentNumber: string,
): Promise<DocumentRow | null> {
  const target = normalizeNumber(documentNumber);
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("document_type", documentType)
    .limit(1000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as DocumentRow[];
  return rows.find((r) => normalizeNumber(r.document_number) === target) ?? null;
}

export async function getPerson(personId: string): Promise<PersonRow | null> {
  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("person_id", personId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as PersonRow) ?? null;
}

export async function getPersonDocuments(personId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase.from("documents").select("*").eq("person_id", personId);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as DocumentRow[];
}

export async function getDocument(documentId: string): Promise<DocumentRow | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("document_id", documentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as DocumentRow) ?? null;
}

export async function listVerifications(limit = 200): Promise<VerificationRecordRow[]> {
  const { data, error } = await supabase
    .from("verification_records")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as VerificationRecordRow[];
}

export async function getVerification(verificationId: string) {
  const [record, fields, events] = await Promise.all([
    supabase
      .from("verification_records")
      .select("*")
      .eq("verification_id", verificationId)
      .maybeSingle(),
    supabase
      .from("verification_field_results")
      .select("*")
      .eq("verification_id", verificationId),
    supabase
      .from("verification_events")
      .select("*")
      .eq("verification_id", verificationId)
      .order("created_at", { ascending: true }),
  ]);
  if (record.error) throw new Error(record.error.message);
  if (!record.data) return null;
  return {
    record: record.data as unknown as VerificationRecordRow,
    fields: (fields.data ?? []) as unknown as {
      field_name: string;
      extracted_value: string | null;
      database_value: string | null;
      match_status: string;
      confidence: number | null;
    }[],
    events: (events.data ?? []) as unknown as {
      event_type: string;
      description: string | null;
      created_at: string;
    }[],
  };
}

export async function saveVerification(outcome: VerificationOutcome, officerName: string) {
  const nameField = outcome.fields.find((f) => f.field_name === "Name");
  const dobField = outcome.fields.find((f) => f.field_name === "Date of Birth");
  const addrField = outcome.fields.find((f) => f.field_name === "Address");
  const numField = outcome.fields.find((f) => f.field_name === "Document Number");
  const statusField = outcome.fields.find((f) => f.field_name === "Document Status");
  const expiryField = outcome.fields.find((f) => f.field_name === "Expiry Date");

  const { error } = await supabase.from("verification_records").insert({
    verification_id: outcome.verificationId,
    person_id: outcome.personId,
    document_id: outcome.documentId,
    document_type: outcome.documentType,
    citizen_name: outcome.citizenName,
    officer_name: officerName,
    source_file_name: outcome.extracted.sourceFileName,
    extracted: JSON.parse(JSON.stringify(outcome.extracted)),
    cross_documents: JSON.parse(JSON.stringify(outcome.crossDocuments)),
    risk_reasons: JSON.parse(JSON.stringify(outcome.riskReasons)),

    name_match: nameField?.match_status ?? "NOT_AVAILABLE",
    dob_match: dobField?.match_status ?? "NOT_AVAILABLE",
    address_match: addrField?.match_status ?? "NOT_AVAILABLE",
    document_number_match: numField?.match_status ?? "NOT_AVAILABLE",
    status_match: statusField?.match_status ?? "NOT_AVAILABLE",
    expiry_valid: expiryField?.match_status ?? "NOT_AVAILABLE",
    face_match: "NOT_AVAILABLE",
    tamper_indicator: "NOT_AVAILABLE",
    risk_score: outcome.riskScore,
    risk_level: outcome.riskLevel,
    verification_status: outcome.verificationStatus,
  });
  if (error) throw new Error(error.message);

  if (outcome.fields.length) {
    const { error: fErr } = await supabase.from("verification_field_results").insert(
      outcome.fields.map((f) => ({
        verification_id: outcome.verificationId,
        field_name: f.field_name,
        extracted_value: f.extracted_value,
        database_value: f.database_value,
        match_status: f.match_status,
        confidence: f.confidence,
      })),
    );
    if (fErr) throw new Error(fErr.message);
  }

  const events = [
    { event_type: "DOCUMENT_UPLOADED", description: `Document received: ${outcome.extracted.sourceFileName}` },
    {
      event_type: "OCR_COMPLETED",
      description: `Tesseract OCR read the image with ${outcome.extracted.ocrConfidence ?? 0}% average word confidence`,
    },
    {
      event_type: "INFORMATION_EXTRACTED",
      description: `${outcome.fields.length} fields parsed from the recognised text`,
    },
    {
      event_type: "DATABASE_MATCH",
      description: outcome.databaseDocument
        ? `Matched record ${outcome.databaseDocument.document_id}`
        : "No matching record found in the synthetic verification database",
    },
    {
      event_type: "CROSS_DOCUMENT_CHECK",
      description: `${outcome.crossDocuments.filter((c) => c.present).length} linked identity records reviewed`,
    },
    {
      event_type: "RISK_ASSESSMENT",
      description: `Risk score ${outcome.riskScore}/100 (${outcome.riskLevel})`,
    },
    { event_type: "FINAL_DECISION", description: outcome.decision },
  ];
  const { error: eErr } = await supabase
    .from("verification_events")
    .insert(events.map((e) => ({ ...e, verification_id: outcome.verificationId })));
  if (eErr) throw new Error(eErr.message);
}
