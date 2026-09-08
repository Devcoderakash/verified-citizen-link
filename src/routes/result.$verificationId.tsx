import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ClipboardList,
  FileSearch,
  Layers,
  Printer,
  ScanLine,
  ShieldAlert,
  UserRound,
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

  return (
    <AppShell
      title="Verification report"
      description={`${record.verification_id} · ${formatDateTime(record.created_at)}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4" /> History
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Printer className="size-4" /> Print report
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <DecisionBanner status={record.verification_status} decision={events.find((e) => e.event_type === "FINAL_DECISION")?.description ?? "Verification completed."} />

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title="Citizen details" icon={UserRound}>
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">
                {initials(record.citizen_name ?? extracted.name ?? "NA")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold tracking-tight">
                  {record.citizen_name ?? extracted.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {DOCUMENT_LABELS[record.document_type]} ·{" "}
                  {maskNumber(record.document_type, extracted.documentNumber)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <FieldRow label="Date of birth" value={formatDate(extracted.dob)} />
              <FieldRow label="Gender" value={extracted.gender ?? "—"} />
              <FieldRow label="Address" value={extracted.address ?? "—"} />
              <FieldRow
                label="Validity"
                value={
                  extracted.expiryDate
                    ? `${formatDate(extracted.issueDate)} → ${formatDate(extracted.expiryDate)}`
                    : "Not applicable"
                }
              />
              <FieldRow label="Reference person ID" value={record.person_id ?? "—"} mono />
            </div>
          </Panel>

          <Panel title="Risk assessment" icon={ShieldAlert}>
            <RiskScoreCard
              score={Number(record.risk_score)}
              level={record.risk_level}
              reasons={record.risk_reasons ?? []}
            />
          </Panel>
        </div>

        <Panel
          title="Field-by-field comparison"
          description="Document values compared with the synthetic reference record"
          icon={ClipboardList}
        >
          <FieldComparison fields={typedFields} documentType={record.document_type} />
        </Panel>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Cross-document verification"
            description="Other identity records linked to the same citizen"
            icon={Layers}
          >
            <CrossDocumentCard entries={record.cross_documents ?? []} />
          </Panel>

          <Panel title="Processing timeline" icon={ScanLine}>
            <Timeline events={events} />
          </Panel>
        </div>

        <Panel title="Verification metadata">
          <FieldRow label="Verification ID" value={record.verification_id} mono />
          <FieldRow label="Performed by" value={record.officer_name ?? "—"} />
          <FieldRow label="Source file" value={record.source_file_name ?? "—"} />
          <FieldRow
            label="Extraction method"
            value={
              extracted.method === "DEMO_FIXTURE"
                ? "Demonstration fixture (no OCR)"
                : "Prototype mapping (no OCR)"
            }
          />
          <FieldRow label="Face verification" value="Not available in this prototype" />
          <FieldRow label="Tamper detection" value="Not available in this prototype" />
        </Panel>

        <p className="text-center text-xs text-muted-foreground">
          Generated by the GovVerify prototype from synthetic demonstration data. This report is not an
          official government verification and must not be used for any real identity decision.
        </p>
      </div>
    </AppShell>
  );
}
