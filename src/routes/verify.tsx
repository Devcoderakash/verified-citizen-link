import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, FileCheck2, RotateCcw, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/govverify/app-shell";
import { DocumentPreview } from "@/components/govverify/document-preview";
import { Panel } from "@/components/govverify/panels";
import { PROCESSING_STEPS, ProcessingSteps } from "@/components/govverify/processing-steps";
import { UploadDropzone, type UploadedDocument } from "@/components/govverify/upload-dropzone";
import { useAuth } from "@/lib/auth";
import { saveVerification } from "@/lib/govverify/db";
import { renderDemoCard, UNKNOWN_PERSON_CARD } from "@/lib/govverify/demo-image";
import {
  DEMO_SCENARIOS,
  extractFromOcr,
  loadDemoRow,
  OcrFieldError,
  type DemoScenario,
} from "@/lib/govverify/extraction";
import { ocrDataUrl, ocrImageFile, type OcrProgress } from "@/lib/govverify/ocr";
import { DOCUMENT_LABELS, type DocumentType } from "@/lib/govverify/types";
import { runVerification } from "@/lib/govverify/verification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "New Identity Verification | GovVerify" },
      {
        name: "description",
        content:
          "Upload an Aadhaar, PAN, Voter ID or Driving Licence image. Tesseract OCR reads the document, then fields are compared with the reference records and scored for risk.",
      },
      { property: "og:title", content: "New Identity Verification | GovVerify" },
      {
        property: "og:description",
        content: "Real OCR of the uploaded ID image, field-by-field comparison and risk scoring.",
      },
    ],
  }),
  component: VerifyPage,
});

const TYPE_OPTIONS: (DocumentType | "AUTO")[] = [
  "AUTO",
  "AADHAAR",
  "PAN",
  "VOTER_ID",
  "DRIVING_LICENCE",
];

type Job = { kind: "upload"; file: File } | { kind: "demo"; scenario: DemoScenario };

function VerifyPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [doc, setDoc] = useState<UploadedDocument | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | "AUTO">("AUTO");
  const [step, setStep] = useState(-1);
  const [ocr, setOcr] = useState<OcrProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastJob, setLastJob] = useState<Job | null>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  const run = useCallback(
    async (job: Job) => {
      setError(null);
      setLastJob(job);
      setOcr(null);
      setStep(0);
      try {
        let ocrResult;
        let scenarioLabel: string | undefined;
        let sourceFileName: string;
        let typeForRun: DocumentType | "AUTO" = selectedType;

        const onProgress = (p: OcrProgress) => {
          setOcr(p);
          setStep(p.phase === "PREPROCESS" ? 1 : 2);
        };

        if (job.kind === "upload") {
          sourceFileName = job.file.name;
          setStep(1);
          ocrResult = await ocrImageFile(job.file, onProgress);
        } else {
          const scenario = job.scenario;
          scenarioLabel = scenario.scenarioLabel;
          sourceFileName = `${scenario.title}.png`;
          typeForRun = "AUTO";
          setStep(1);
          const row = await loadDemoRow(scenario);
          const cardUrl = renderDemoCard({
            documentType: scenario.documentType,
            row,
            printedOverride: scenario.printedOverride,
            ...(row ? {} : { fallback: UNKNOWN_PERSON_CARD }),
          });
          ocrResult = await ocrDataUrl(cardUrl, onProgress);
        }

        setStep(3);
        const { extracted } = extractFromOcr(ocrResult, typeForRun, sourceFileName, scenarioLabel);

        setStep(4);
        const outcome = await runVerification(extracted);
        setStep(5);
        setStep(6);
        await saveVerification(outcome, session?.name ?? "Unknown officer");
        setStep(PROCESSING_STEPS.length);
        await queryClient.invalidateQueries({ queryKey: ["verifications"] });
        void navigate({
          to: "/result/$verificationId",
          params: { verificationId: outcome.verificationId },
        });
      } catch (e) {
        setStep(-1);
        setOcr(null);
        setError(
          e instanceof OcrFieldError
            ? e.message
            : e instanceof Error
              ? `OCR processing failed: ${e.message}`
              : "OCR processing failed. Please try again with a clearer image.",
        );
      }
    },
    [navigate, queryClient, selectedType, session],
  );

  const processing = step >= 0;

  return (
    <AppShell
      title="New verification"
      description="Upload a citizen's government-issued identity document — the image is read by OCR"
    >
      {processing ? (
        <div className="mx-auto max-w-2xl">
          <Panel
            title="Document processing"
            description="Reading the uploaded image"
            icon={ScanLine}
          >
            <ProcessingSteps
              current={step}
              ocrProgress={ocr?.phase === "RECOGNISE" ? ocr.progress : undefined}
              ocrStatus={ocr?.status}
            />
          </Panel>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Panel
              title="Document Intake &amp; Inspection"
              description="Aadhaar Card, PAN Card, Voter ID (EPIC) or Driving Licence"
              icon={FileCheck2}
            >
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
                    Select Document Type
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Auto-detection active by default
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-md border p-2.5 text-center transition-all",
                        selectedType === t
                          ? "border-primary bg-primary/10 font-semibold text-primary shadow-2xs ring-1 ring-primary/40"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/60 hover:text-foreground",
                      )}
                    >
                      <span className="text-xs">
                        {t === "AUTO" ? "Auto Detect" : DOCUMENT_LABELS[t]}
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground/80">
                        {t === "AUTO"
                          ? "From text header"
                          : t === "AADHAAR"
                            ? "12-digit UID"
                            : t === "PAN"
                              ? "10-char alphanumeric"
                              : t === "VOTER_ID"
                                ? "EPIC Card"
                                : "State DL Series"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {doc ? (
                <div className="space-y-4">
                  <DocumentPreview
                    fileName={doc.file.name}
                    fileSize={doc.file.size}
                    previewUrl={doc.previewUrl}
                    documentType={selectedType === "AUTO" ? undefined : selectedType}
                    onRemove={() => {
                      if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);
                      setDoc(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void run({ kind: "upload", file: doc.file })}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                  >
                    <ShieldCheck className="size-4" /> Run Optical Character Recognition &amp;
                    Verify
                  </button>
                </div>
              ) : (
                <UploadDropzone
                  onAccepted={(d) => {
                    objectUrl.current = d.previewUrl;
                    setDoc(d);
                  }}
                />
              )}

              {error ? (
                <div className="mt-4 rounded-md border border-danger/30 bg-danger-soft p-3.5 text-xs text-danger">
                  <p className="flex items-start gap-2 font-medium">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
                  </p>
                  {lastJob ? (
                    <button
                      type="button"
                      onClick={() => void run(lastJob)}
                      className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-danger/40 bg-card px-3 py-1.5 text-xs font-semibold text-danger shadow-2xs hover:bg-danger-soft"
                    >
                      <RotateCcw className="size-3.5" /> Re-attempt OCR Run
                    </button>
                  ) : null}
                  <p className="mt-2 text-[11px] text-danger/80">
                    Audit guarantee: No synthetic placeholders are substituted when OCR cannot
                    extract a field.
                  </p>
                </div>
              ) : null}
            </Panel>

            <Panel
              title="Demonstration Test Scenarios"
              description="Synthetically generated physical ID cards for instant audit testing"
              icon={Sparkles}
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                {DEMO_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void run({ kind: "demo", scenario: s })}
                    className="group flex cursor-pointer flex-col justify-between rounded-md border border-border bg-card p-3.5 text-left transition-all hover:border-primary/50 hover:bg-secondary/40 hover:shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary">
                          {s.title}
                        </span>
                        <span className="rounded border border-border bg-secondary/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {DOCUMENT_LABELS[s.documentType]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {s.subtitle}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <span>Execute OCR Verification</span>
                      <ShieldCheck className="size-3.5 transition-transform group-hover:scale-110" />
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Verification Pipeline Architecture" icon={ShieldCheck}>
              <ol className="space-y-3 text-xs text-muted-foreground">
                {[
                  "Document image preprocessed via greyscale and Otsu contrast enhancement.",
                  "Tesseract OCR neural network parses raw text lines in-memory.",
                  "Regular expression parser extracts name, identifier, date of birth and address.",
                  "Document identifier looked up in the 600-record synthetic registry.",
                  "Cross-document consistency engine verifies linked credentials for the citizen.",
                  "Heuristic risk engine calculates weighted score and decision recommendation.",
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

            <Panel title="Data Privacy &amp; Air-Gap Policy">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Optical character recognition runs entirely on the client workstation. Uploaded
                images are never sent over external network APIs or stored in external databases.
                All reference data belongs to the synthetic demonstration database.
              </p>
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}
