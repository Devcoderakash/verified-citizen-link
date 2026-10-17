import { FileText, ImageIcon, X } from "lucide-react";
import { DOCUMENT_LABELS, type DocumentType } from "@/lib/govverify/types";

export function DocumentPreview({
  fileName,
  fileSize,
  previewUrl,
  documentType,
  onRemove,
  compact,
}: {
  fileName: string;
  fileSize?: number;
  previewUrl?: string | null;
  documentType?: DocumentType | undefined;
  onRemove?: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Uploaded document preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <FileText className="size-8 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{fileName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {typeof fileSize === "number" ? `${(fileSize / 1024).toFixed(0)} KB · ` : ""}
          {documentType ? DOCUMENT_LABELS[documentType] : "Document received"}
        </p>
        {!compact ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-info-soft px-2 py-1 text-[11px] text-primary">
            <ImageIcon className="size-3.5" /> Stored only in this browser session
          </p>
        ) : null}
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Remove document"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
