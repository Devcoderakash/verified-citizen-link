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
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-all",
          dragging
            ? "border-primary bg-info-soft scale-[1.005]"
            : "border-border bg-secondary/40 hover:border-primary/50 hover:bg-info-soft/60",
        )}
      >
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-full bg-card text-primary shadow-sm ring-1 ring-border transition-transform",
            dragging && "-translate-y-1",
          )}
        >
          {busy ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
        </span>
        <p className="mt-4 text-sm font-semibold">Upload government ID</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag &amp; drop the document here, or <span className="text-primary underline">browse files</span>
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Supported: JPG, JPEG, PNG, WEBP · Maximum size 10 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          <FileUp className="size-4" /> {error}
        </p>
      ) : null}
    </div>
  );
}
