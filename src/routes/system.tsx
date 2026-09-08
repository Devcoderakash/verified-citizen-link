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
    <AppShell title="System information" description="Scope, data sources and methodology of this prototype">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Prototype declaration" icon={Info}>
          <p className="text-sm text-muted-foreground">
            GovVerify is a demonstration system. It runs entirely on synthetic identity records created for
            this project and is <strong className="text-foreground">not connected</strong> to UIDAI, the
            Income Tax Department, the Election Commission of India, Parivahan or any other live government
            database or API. No result produced here has official standing.
          </p>
        </Panel>

        <Panel title="Reference data" icon={Database}>
          <FieldRow label="Citizen records" value="150 synthetic identities" />
          <FieldRow label="Document records" value="600 (4 per identity)" />
          <FieldRow label="Document types" value="Aadhaar, PAN, Voter ID, Driving Licence" />
          <FieldRow label="Data origin" value="Provided synthetic demonstration datasets" />
        </Panel>

        <Panel title="Verification pipeline" icon={Workflow}>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {[
              "Document intake — image accepted and validated in the browser.",
              "Image preprocessing — resize, greyscale conversion and contrast correction.",
              "Optical character recognition — Tesseract reads the text from the image pixels.",
              "Type identification — inferred from the recognised text, or selected by the officer.",
              "Field parsing — name, date of birth, number and address parsed from the OCR text only; unreadable fields stay blank.",
              "Record matching — document number looked up in the synthetic reference database.",
              "Field comparison — name, date of birth, number, address, gender, status and validity.",
              "Cross-document check — the citizen's other identity records are compared for conflicts.",
              "Risk assessment — weighted signals produce a score, level and stated reasons.",
            ].map((line, i) => (
              <li key={line} className="flex gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-info-soft text-[11px] font-semibold text-primary">
                  {i + 1}
                </span>
                {line}
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Risk weighting" icon={ShieldAlert}>
          <p className="mb-3 text-sm text-muted-foreground">
            Each triggered signal adds its weight; the total is capped at 100. Bands: 0–10 low, 11–40
            medium, 41–70 high, 71–100 critical.
          </p>

          {(Object.keys(RISK_WEIGHTS) as (keyof typeof RISK_WEIGHTS)[]).map((k) => (
            <FieldRow key={k} label={WEIGHT_LABELS[k]} value={`+${RISK_WEIGHTS[k]}`} mono />
          ))}
        </Panel>

        <Panel title="Not implemented" icon={CircleSlash}>
          <ul className="space-y-3 text-sm">
            {UNAVAILABLE_SIGNALS.map((s) => (
              <li key={s.code} className="rounded-lg border border-dashed border-border px-3 py-2.5">
                <p className="font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.note}</p>
              </li>
            ))}
            <li className="rounded-lg border border-dashed border-border px-3 py-2.5">
              <p className="font-medium">Live government API lookup</p>
              <p className="text-xs text-muted-foreground">
                Not available — all matching happens against synthetic local records.
              </p>
            </li>
          </ul>
        </Panel>

        <Panel title="Session" icon={Layers}>
          <FieldRow label="Officer" value={session?.name ?? "—"} />
          <FieldRow label="Staff ID" value={session?.staffId ?? "—"} mono />
          <FieldRow label="Role" value={session?.role ?? "—"} />
          <FieldRow label="Office" value={session?.office ?? "—"} />
          <FieldRow
            label="Authentication"
            value="Prototype browser session — no real directory service"
          />
        </Panel>
      </div>
    </AppShell>
  );
}
