import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Database,
  ClipboardList,
  FileSearch,
  Layers,
  Printer,
  ScanLine,
  ScanText,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/govverify/app-shell";
import { EmptyState, FieldRow, Panel } from "@/components/govverify/panels";
import {
  CrossDocumentCard,
  DecisionBanner,
  FieldComparison,
  RiskScoreCard,
  Timeline,
} from "@/components/govverify/verification-views";
import { getVerification } from "@/lib/govverify/db";
import { formatDate, formatDateTime, initials, maskNumber } from "@/lib/govverify/format";
import { DOCUMENT_LABELS, type FieldResult } from "@/lib/govverify/types";

export const Route = createFileRoute("/result/$verificationId")({
  head: () => ({
    meta: [
      { title: "Verification Result | GovVerify" },
      {
        name: "description",
        content:
          "Detailed identity verification result: field-by-field comparison, cross-document consistency, risk breakdown and the full processing timeline.",
      },
      { property: "og:title", content: "Verification Result | GovVerify" },
      {
        property: "og:description",
        content: "Field comparison, cross-document checks, risk breakdown and processing timeline.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { verificationId } = useParams({ from: "/result/$verificationId" });
  const { data, isLoading } = useQuery({
    queryKey: ["verification", verificationId],
    queryFn: () => getVerification(verificationId),
  });

  if (isLoading) {
    return (
      <AppShell title="Verification result" description="Loading report…">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="Verification result">
        <Panel>
          <EmptyState
            icon={FileSearch}
            title="Report not found"
            description="No verification report exists for this reference number."
            action={
              <Link
                to="/history"
                className="mt-1 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Back to history
              </Link>
            }
          />
        </Panel>
      </AppShell>
    );
  }

  const { record, fields, events } = data;
  const extracted = record.extracted;
  const typedFields = fields as unknown as FieldResult[];
  const hasRecord = record.verification_status !== "NO_RECORD" && Boolean(record.person_id);
  const dbValue = (label: string) =>
    typedFields.find((f) => f.field_name === label)?.database_value ?? null;

  return (
    <AppShell
      title="Identity Inspection Dossier"
      description={`Official Audit Reference: ${record.verification_id} · Recorded: ${formatDateTime(record.created_at)}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/history"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-3.5" />
            <span>Archive</span>
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            <Printer className="size-3.5" />
            <span>Print Audit Certificate</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <DecisionBanner
          status={record.verification_status}
          decision={
            events.find((e) => e.event_type === "FINAL_DECISION")?.description ??
            "Verification completed."
          }
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Extracted Document Data (OCR Ingestion)"
            description="Optical character recognition values parsed directly from image pixels"
            icon={ScanText}
          >
            <div className="flex items-start gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-2xs">
                {initials(extracted.name ?? "NA")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold tracking-tight text-foreground">
                  {extracted.name || "Unreadable Name"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded border border-border bg-secondary/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                    {DOCUMENT_LABELS[record.document_type]}
                  </span>
                  <span>•</span>
                  <span className="font-mono">
                    {maskNumber(record.document_type, extracted.documentNumber)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-0.5">
              <FieldRow
                label="Date of Birth"
                value={extracted.dob ? formatDate(extracted.dob) : "Not Detected"}
              />
              <FieldRow label="Gender" value={extracted.gender ?? "Not Detected"} />
              <FieldRow label="Physical Address" value={extracted.address ?? "Not Detected"} />
              <FieldRow
                label="Printed Validity"
                value={
                  extracted.expiryDate
                    ? `${formatDate(extracted.issueDate)} → ${formatDate(extracted.expiryDate)}`
                    : "Not applicable"
                }
              />
              <FieldRow
                label="OCR Confidence Index"
                value={
                  typeof extracted.ocrConfidence === "number"
                    ? `${extracted.ocrConfidence}% mean word recognition`
                    : "—"
                }
              />
            </div>
            {extracted.missingFields?.length ? (
              <p className="mt-3 rounded-md border border-warning/30 bg-warning-soft p-3 text-xs text-warning-foreground leading-relaxed">
                <strong className="font-semibold">Omission Notice:</strong> OCR could not extract
                fields: {extracted.missingFields.join(", ")}. These fields remain unpopulated in
                accordance with audit integrity rules.
              </p>
            ) : null}
          </Panel>

          <Panel
            title="Database record"
            description="Reference record searched using the values read from the document"
            icon={Database}
          >
            <div className="mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
              {hasRecord ? (
                <>
                  <span className="inline-block size-2 rounded-full bg-success" /> Record found: YES
                </>
              ) : (
                <>
                  <span className="inline-block size-2 rounded-full bg-danger" /> Record found: NO
                </>
              )}
            </div>
            {hasRecord ? (
              <div>
                <FieldRow label="Person ID" value={record.person_id ?? "—"} mono />
                <FieldRow
                  label="Name on record"
                  value={dbValue("Name") ?? record.citizen_name ?? "—"}
                />
                <FieldRow label="Date of birth" value={dbValue("Date of Birth") ?? "—"} />
                <FieldRow label="Document number" value={dbValue("Document Number") ?? "—"} mono />
                <FieldRow label="Address" value={dbValue("Address") ?? "—"} />
                <FieldRow label="Record status" value={dbValue("Document Status") ?? "—"} />
              </div>
            ) : (
              <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-3 text-sm text-danger">
                <p className="font-semibold">Identity record not found</p>
                <p className="mt-1">
                  The extracted document information could not be matched with the available
                  synthetic verification records. No other person's details are shown in place of
                  this document.
                </p>
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Risk assessment" icon={ShieldAlert}>
          <RiskScoreCard
            score={Number(record.risk_score)}
            level={record.risk_level}
            reasons={record.risk_reasons ?? []}
          />
        </Panel>

        <Panel
          title="Field-by-field comparison"
          description="Document values compared with the reference record"
          icon={ClipboardList}
        >
          <FieldComparison fields={typedFields} documentType={record.document_type} />
        </Panel>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Cross-document verification"
            description={
              record.person_id
                ? `Other identity records linked to ${record.person_id}`
                : "No linked records — the document was not matched"
            }
            icon={Layers}
          >
            <CrossDocumentCard entries={record.cross_documents ?? []} />
          </Panel>

          <Panel title="Processing timeline" icon={ScanLine}>
            <Timeline events={events} />
          </Panel>
        </div>

        {extracted.ocrText ? (
          <Panel
            title="Raw OCR output"
            description="Exact text recognised from the image"
            icon={ScanText}
          >
            <details>
              <summary className="cursor-pointer text-sm font-medium text-primary">
                Show recognised text
              </summary>
              <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-secondary p-3 text-xs whitespace-pre-wrap">
                {extracted.ocrText}
              </pre>
            </details>
          </Panel>
        ) : null}

        <Panel title="Verification metadata">
          <FieldRow label="Verification ID" value={record.verification_id} mono />
          <FieldRow label="Performed by" value={record.officer_name ?? "—"} />
          <FieldRow label="Source file" value={record.source_file_name ?? "—"} />
          <FieldRow
            label="Extraction method"
            value="Tesseract OCR (in-browser, real text recognition)"
          />
          <FieldRow
            label="Document type detection"
            value={
              extracted.typeDetection
                ? `${extracted.typeDetection.source === "MANUAL" ? "Selected by officer" : "Detected from OCR text"} (${extracted.typeDetection.confidence.toLowerCase()} confidence)`
                : "—"
            }
          />
          <FieldRow
            label="OCR duration"
            value={
              extracted.ocrDurationMs ? `${(extracted.ocrDurationMs / 1000).toFixed(1)} s` : "—"
            }
          />
          <FieldRow label="Face verification" value="Not available in this prototype" />
          <FieldRow label="Tamper detection" value="Not available in this prototype" />
        </Panel>

        <p className="text-center text-xs text-muted-foreground">
          Generated by the GovVerify prototype from synthetic demonstration data. This report is not
          an official government verification and must not be used for any real identity decision.
        </p>
      </div>
    </AppShell>
  );
}
