import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, FileCheck2, Sparkles, ScanLine, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/govverify/app-shell";
import { DocumentPreview } from "@/components/govverify/document-preview";
import { Panel } from "@/components/govverify/panels";
import { PROCESSING_STEPS, ProcessingSteps } from "@/components/govverify/processing-steps";
import { UploadDropzone, type UploadedDocument } from "@/components/govverify/upload-dropzone";
import { useAuth } from "@/lib/auth";
import { saveVerification } from "@/lib/govverify/db";
import { DEMO_SCENARIOS, extractDocument } from "@/lib/govverify/extraction";
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
          "Upload an Aadhaar, PAN, Voter ID or Driving Licence document and run a field-by-field identity verification with cross-document checks and risk scoring.",
      },
      { property: "og:title", content: "New Identity Verification | GovVerify" },
      {
        property: "og:description",
        content: "Upload a government ID and run verification with cross-document checks and risk scoring.",
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

function VerifyPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [doc, setDoc] = useState<UploadedDocument | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | "AUTO">("AUTO");
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  const process = useCallback(
    async (input: Parameters<typeof extractDocument>[0]) => {
      setError(null);
      setStep(0);
      try {
        const tick = (n: number, ms: number) =>
          new Promise<void>((resolve) =>
            window.setTimeout(() => {
              setStep(n);
              resolve();
            }, ms),
          );

        await tick(1, 550);
        const { extracted } = await extractDocument(input);
        await tick(2, 500);
        await tick(3, 600);
        const outcome = await runVerification(extracted);
        await tick(4, 550);
        await tick(5, 550);
        await saveVerification(outcome, session?.name ?? "Unknown officer");
        await tick(PROCESSING_STEPS.length, 500);
        await queryClient.invalidateQueries({ queryKey: ["verifications"] });
        void navigate({
          to: "/result/$verificationId",
          params: { verificationId: outcome.verificationId },
        });
      } catch (e) {
        setStep(-1);
        setError(e instanceof Error ? e.message : "Verification could not be completed.");
      }
    },
    [navigate, queryClient, session],
  );

  const processing = step >= 0;

  return (
    <AppShell
      title="New verification"
      description="Upload a citizen's government-issued identity document"
    >
      {processing ? (
        <div className="mx-auto max-w-2xl">
          <Panel title="Verification in progress" description="Please wait while checks complete" icon={ScanLine}>
            <ProcessingSteps current={step} />
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
                      {t === "AUTO" ? "Auto-detect" : DOCUMENT_LABELS[t]}
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
                    onClick={() => {
                      void (async () => {
                        let imageDataUrl: string | undefined;
                        if (doc.file.type.startsWith("image/")) {
                          imageDataUrl = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(String(reader.result));
                            reader.onerror = () => reject(new Error("File could not be read."));
                            reader.readAsDataURL(doc.file);
                          });
                        }
                        await process({
                          kind: "upload",
                          fileName: doc.file.name,
                          selectedType,
                          imageDataUrl,
                        });
                      })();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ShieldCheck className="size-4" /> Start verification
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
                <p className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
                </p>
              ) : null}
            </Panel>

            <Panel title="Demonstration documents" description="Preloaded cases for a reliable walkthrough" icon={Sparkles}>
              <div className="grid gap-3 sm:grid-cols-2">
                {DEMO_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void process({ kind: "demo", scenarioId: s.id })}
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
            <Panel title="How this prototype works" icon={ShieldCheck}>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  "The uploaded file is accepted and its type is identified.",
                  "Document details are resolved by the prototype extraction layer — no OCR is performed.",
                  "Values are compared field-by-field with the synthetic reference records.",
                  "The citizen's other identity records are checked for conflicts.",
                  "A transparent weighted risk score and decision are produced.",
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
                Uploaded files stay in your browser and are never sent to a government system. Results are
                produced from synthetic demonstration records only and must not be used for any real
                identity decision.
              </p>
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}
