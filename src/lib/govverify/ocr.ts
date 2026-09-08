/**
 * OCR SERVICE — real text recognition with Tesseract.js (browser only).
 * No values are ever invented here: everything returned comes from the
 * pixels of the uploaded image.
 */
import { createWorker } from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number; // 0-100, computed from recognised word confidences
  wordCount: number;
  preprocessedUrl: string;
  durationMs: number;
}

export type OcrPhase = "PREPROCESS" | "RECOGNISE";

export interface OcrProgress {
  phase: OcrPhase;
  progress: number; // 0-1 within the phase
  status: string;
}

/**
 * Load an image file, scale it up for small scans, convert to greyscale and
 * stretch contrast. The user's original file is never modified.
 */
export async function preprocessImage(file: File): Promise<string> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("The image file could not be opened."));
      el.src = bitmapUrl;
    });

    const targetWidth = Math.min(2200, Math.max(1200, img.naturalWidth));
    const scale = targetWidth / img.naturalWidth;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image preprocessing is not supported in this browser.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;

    // Greyscale + histogram bounds for contrast stretching.
    let min = 255;
    let max = 0;
    const grey = new Uint8ClampedArray(w * h);
    for (let i = 0, g = 0; i < px.length; i += 4, g++) {
      const v = Math.round(0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!);
      grey[g] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = Math.max(1, max - min);

    // Light 3x3 median-ish noise reduction on the contrast-stretched values.
    for (let i = 0, g = 0; i < px.length; i += 4, g++) {
      const stretched = ((grey[g]! - min) / range) * 255;
      const v = Math.max(0, Math.min(255, Math.round((stretched - 128) * 1.25 + 128)));
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
      px[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

/** Run Tesseract on an already preprocessed image (data URL). */
export async function runOcr(
  preprocessedUrl: string,
  onProgress?: (p: OcrProgress) => void,
): Promise<OcrResult> {
  const started = performance.now();
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      onProgress?.({
        phase: "RECOGNISE",
        progress: typeof m.progress === "number" ? m.progress : 0,
        status: m.status,
      });
    },
  });
  try {
    const { data } = await worker.recognize(preprocessedUrl, {}, { blocks: true, text: true });
    const blocks = (data as { blocks?: unknown[] }).blocks ?? [];
    const words: { confidence?: number }[] = [];
    const collect = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const n = node as Record<string, unknown>;
      if (typeof n["text"] === "string" && typeof n["confidence"] === "number" && !n["words"] && !n["lines"] && !n["paragraphs"]) {
        words.push({ confidence: n["confidence"] as number });
      }
      for (const key of ["paragraphs", "lines", "words"]) {
        const child = n[key];
        if (Array.isArray(child)) child.forEach(collect);
      }
    };
    blocks.forEach(collect);
    const confidences = words
      .map((w) => (typeof w.confidence === "number" ? w.confidence : null))
      .filter((c): c is number => c !== null && c > 0);
    const confidence = confidences.length
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : Math.round((data as { confidence?: number }).confidence ?? 0);
    return {
      text: data.text ?? "",
      confidence,
      wordCount: words.length,
      preprocessedUrl,
      durationMs: Math.round(performance.now() - started),
    };
  } finally {
    await worker.terminate();
  }
}

export async function ocrImageFile(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<OcrResult> {
  onProgress?.({ phase: "PREPROCESS", progress: 0, status: "preprocessing image" });
  const preprocessedUrl = await preprocessImage(file);
  onProgress?.({ phase: "PREPROCESS", progress: 1, status: "preprocessing complete" });
  return runOcr(preprocessedUrl, onProgress);
}

export async function ocrDataUrl(
  dataUrl: string,
  onProgress?: (p: OcrProgress) => void,
): Promise<OcrResult> {
  onProgress?.({ phase: "PREPROCESS", progress: 1, status: "preprocessing complete" });
  return runOcr(dataUrl, onProgress);
}
