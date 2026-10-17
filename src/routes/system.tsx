import { createFileRoute } from "@tanstack/react-router";
import { CircleSlash, Database, Info, Layers, ShieldAlert, Workflow } from "lucide-react";
import { AppShell } from "@/components/govverify/app-shell";
import { FieldRow, Panel } from "@/components/govverify/panels";
import { RISK_WEIGHTS, UNAVAILABLE_SIGNALS } from "@/lib/govverify/risk";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/system")({
  head: () => ({
    meta: [
      { title: "System Information & Scope | GovVerify" },
      {
        name: "description",
        content:
          "How the GovVerify prototype works: data sources, verification pipeline, risk weighting, and the capabilities deliberately not implemented.",
      },
      { property: "og:title", content: "System Information & Scope | GovVerify" },
      {
        property: "og:description",
        content: "Data sources, verification pipeline, risk weighting and prototype limitations.",
      },
    ],
  }),
  component: SystemPage,
});

const WEIGHT_LABELS: Record<keyof typeof RISK_WEIGHTS, string> = {
  NAME_MISMATCH: "Name mismatch",
  DOB_MISMATCH: "Date of birth mismatch",
  NUMBER_MISMATCH: "Document number mismatch",
  ADDRESS_MISMATCH: "Address mismatch",
  EXPIRED_DOCUMENT: "Document validity expired",
  CROSS_DOCUMENT_CONFLICT: "Cross-document inconsistency",
  TAMPER_INDICATOR: "Tamper indicator (not implemented)",
  FACE_MISMATCH: "Face mismatch (not implemented)",
};

function SystemPage() {
  const { session } = useAuth();
  return (
    <AppShell
      title="System Architecture &amp; Methodology"
      description="Technical parameters, synthetic data origin, and verification heuristics"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Prototype Demonstration Charter" icon={Info}>
          <p className="text-xs text-muted-foreground leading-relaxed">
            GovVerify is an autonomous civil credential verification platform prototype. It
            functions entirely on synthetic identity records created specifically for testing and
            evaluation. It is{" "}
            <strong className="font-semibold text-foreground">strictly not connected</strong> to
            UIDAI, the Income Tax Department, the Election Commission of India, Parivahan, or any
            active state registry.
          </p>
        </Panel>

        <Panel title="Synthetic Registry Specifications" icon={Database}>
          <FieldRow label="Citizen Profiles" value="150 Synthetic Identities" />
          <FieldRow label="Linked Documents" value="600 Document Records (4 per citizen)" />
          <FieldRow label="Credential Families" value="Aadhaar, PAN, Voter ID, Driving Licence" />
          <FieldRow label="Registry Engine" value="Local Synthetic Indexed Memory" />
        </Panel>

        <Panel title="In-Browser Verification Pipeline" icon={Workflow}>
          <ol className="space-y-3 text-xs text-muted-foreground">
            {[
              "Document intake: client-side image validation in memory.",
              "Preprocessing: greyscale normalization and threshold correction.",
              "Optical character recognition: Tesseract reads character tokens in-browser.",
              "Document classification: type inferred from tokens or officer selection.",
              "Field extraction: name, DOB, ID number and address parsed from OCR only.",
              "Record reconciliation: ID looked up in synthetic reference records.",
              "Field-by-field verification: comparison across name, DOB, number, address.",
              "Cross-document consistency: other credentials for same citizen checked.",
              "Risk scoring: weighted signal deduction produces 0–100 risk score.",
            ].map((line, i) => (
              <li key={line} className="flex gap-2.5">
                <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary ring-1 ring-border">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{line}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Automated Risk Scoring Weights" icon={ShieldAlert}>
          <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
            Each triggered discrepancy contributes its weight to the aggregate risk score. Final
            risk index is capped at 100.
          </p>

          <div className="space-y-0.5">
            {(Object.keys(RISK_WEIGHTS) as (keyof typeof RISK_WEIGHTS)[]).map((k) => (
              <FieldRow key={k} label={WEIGHT_LABELS[k]} value={`+${RISK_WEIGHTS[k]} pts`} mono />
            ))}
          </div>
        </Panel>

        <Panel title="Prototype Feature Boundaries" icon={CircleSlash}>
          <ul className="space-y-2.5 text-xs">
            {UNAVAILABLE_SIGNALS.map((s) => (
              <li key={s.code} className="rounded-md border border-border bg-secondary/30 p-2.5">
                <p className="font-semibold text-foreground">{s.label}</p>
                <p className="mt-0.5 text-muted-foreground">{s.note}</p>
              </li>
            ))}
            <li className="rounded-md border border-border bg-secondary/30 p-2.5">
              <p className="font-semibold text-foreground">Live Government Registry Lookup</p>
              <p className="mt-0.5 text-muted-foreground">
                Deliberately not implemented to maintain privacy and self-contained prototype
                evaluation.
              </p>
            </li>
          </ul>
        </Panel>

        <Panel title="Workstation Officer Context" icon={Layers}>
          <FieldRow label="Authorized Officer" value={session?.name ?? "—"} />
          <FieldRow label="Staff Identification" value={session?.staffId ?? "—"} mono />
          <FieldRow label="Assigned Role" value={session?.role ?? "—"} />
          <FieldRow label="Jurisdiction Office" value={session?.office ?? "—"} />
          <FieldRow label="Session Security" value="Encrypted Local Session Store" />
        </Panel>
      </div>
    </AppShell>
  );
}
