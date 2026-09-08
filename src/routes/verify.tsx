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

type Job =
  | { kind: "upload"; file: File }
  | { kind: "demo"; scenario: DemoScenario };

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
          <Panel title="Document processing" description="Reading the uploaded image" icon={ScanLine}>
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
              title="Document upload"
              description="Aadhaar Card, PAN Card, Voter ID or Driving Licence"
              icon={FileCheck2}
            >
              <div className="mb-5">
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Document type
                </p>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm transition-colors",
                        selectedType === t
                          ? "border-primary bg-info-soft font-medium text-primary"
                          : "border-border hover:border-primary/40 hover:bg-secondary",
                      )}
                    >
                      {t === "AUTO" ? "Detect from document" : DOCUMENT_LABELS[t]}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Auto-detection reads the wording printed on the document. Select a type manually if
                  detection fails.
                </p>
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ShieldCheck className="size-4" /> Run OCR &amp; verify
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
                <div className="mt-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-3 text-sm text-danger">
                  <p className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
                  </p>
                  {lastJob ? (
                    <button
                      type="button"
                      onClick={() => void run(lastJob)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium"
                    >
                      <RotateCcw className="size-3.5" /> Retry OCR
                    </button>
                  ) : null}
                  <p className="mt-2 text-xs">
                    No demonstration values are ever substituted when OCR fails.
                  </p>
                </div>
              ) : null}
            </Panel>

            <Panel
              title="Demonstration documents"
              description="Card images generated from the reference records, then read by the same OCR engine"
              icon={Sparkles}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {DEMO_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void run({ kind: "demo", scenario: s })}
                    className="rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-info-soft"
                  >
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.subtitle}</p>
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="How this works" icon={ShieldCheck}>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  "The image is resized, converted to greyscale and contrast-corrected for reading.",
                  "Tesseract OCR reads the text directly from those pixels.",
                  "The document type and fields are parsed from that recognised text only.",
                  "The matching reference record is searched using the values read from the document.",
                  "Linked records for the matched person are checked and a risk score is produced.",
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

            <Panel title="Important notice">
              <p className="text-sm text-muted-foreground">
                OCR runs inside your browser — the image is never uploaded to a government system. If a
                field cannot be read, it is reported as unreadable and never filled in from the
                reference records. Results come from synthetic demonstration data only.
              </p>
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}
