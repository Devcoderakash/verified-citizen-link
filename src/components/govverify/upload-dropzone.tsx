import { FileUp, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export interface UploadedDocument {
  file: File;
  previewUrl: string | null;
  isPdf: boolean;
}

export function UploadDropzone({
  onAccepted,
  busy,
}: {
  onAccepted: (doc: UploadedDocument) => void;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    setError(null);
    const file = files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("OCR needs an image. Upload a JPG, JPEG, PNG or WEBP photo/scan of the document.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large. The maximum accepted size is 10 MB.");
      return;
    }
    const isPdf = file.type === "application/pdf";
    onAccepted({
      file,
      previewUrl: isPdf ? null : URL.createObjectURL(file),
      isPdf,
    });
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-all",
          dragging
            ? "border-primary bg-primary/5 scale-[1.005]"
            : "border-border bg-card hover:border-primary/50 hover:bg-secondary/40",
        )}
      >
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-lg bg-secondary text-primary shadow-2xs ring-1 ring-border transition-transform",
            dragging && "-translate-y-1",
          )}
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
        </span>
        <p className="mt-3.5 text-sm font-semibold text-foreground">
          Ingest Citizen Document Image
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Drag and drop card image here, or{" "}
          <span className="font-medium text-primary underline underline-offset-2">
            browse filesystem
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono">JPG</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono">JPEG</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono">PNG</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono">WEBP</span>
          <span>·</span>
          <span>Max 10 MB</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error ? (
        <p className="mt-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft p-3 text-xs font-medium text-danger">
          <FileUp className="size-4 shrink-0" /> {error}
        </p>
      ) : null}
    </div>
  );
}
