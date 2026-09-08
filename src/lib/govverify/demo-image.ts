/**
 * Renders a synthetic ID-card image from a reference record so the demo
 * documents go through the SAME real OCR pipeline as an upload.
 * The image is drawn from record values; OCR then reads it back from pixels.
 */
import { DOCUMENT_LABELS, type DocumentRow, type DocumentType } from "./types";

const HEADERS: Record<DocumentType, string[]> = {
  AADHAAR: ["Government of India", "Unique Identification Authority of India"],
  PAN: ["INCOME TAX DEPARTMENT", "Permanent Account Number Card"],
  VOTER_ID: ["Election Commission of India", "Elector Photo Identity Card"],
  DRIVING_LICENCE: ["Transport Department", "Driving Licence"],
};

function fmt(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export interface DemoCardInput {
  documentType: DocumentType;
  row: DocumentRow | null;
  printedOverride?: { dob?: string; name?: string } | undefined;
  /** Used when there is no reference record (unknown-person scenario). */
  fallback?: {
    name: string;
    dob: string;
    gender: string;
    address: string;
    documentNumber: string;
  };
}

export function renderDemoCard(input: DemoCardInput): string {
  const { documentType, row, printedOverride, fallback } = input;
  const name = printedOverride?.name ?? row?.holder_name ?? fallback?.name ?? "";
  const dob = printedOverride?.dob ?? row?.dob ?? fallback?.dob ?? null;
  const gender = row?.gender ?? fallback?.gender ?? "";
  const address = row?.address ?? fallback?.address ?? "";
  const number = row?.document_number ?? fallback?.documentNumber ?? "";

  const W = 1400;
  const H = 880;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot render the demo document.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0b2f63";
  ctx.fillRect(0, 0, W, 130);

  const [h1, h2] = HEADERS[documentType];
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 34px Arial, sans-serif";
  ctx.fillText(h1 ?? "", 48, 58);
  ctx.font = "26px Arial, sans-serif";
  ctx.fillText(h2 ?? "", 48, 100);

  ctx.strokeStyle = "#c7ccd6";
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 180, 230, 280);
  ctx.fillStyle = "#8a919c";
  ctx.font = "22px Arial, sans-serif";
  ctx.fillText("PHOTO", 120, 325);

  const NUMBER_LABEL: Record<DocumentType, string> = {
    AADHAAR: "Aadhaar Number",
    PAN: "Permanent Account Number",
    VOTER_ID: "EPIC Number",
    DRIVING_LICENCE: "Licence Number",
  };
  const spacedNumber =
    documentType === "AADHAAR" ? number.replace(/(\d{4})(?=\d)/g, "$1 ").trim() : number;
  const rows: [string, string][] = [
    ["Name", name],
    [NUMBER_LABEL[documentType], spacedNumber],
  ];
  if (dob) rows.push(["DOB", fmt(dob)]);
  if (gender) rows.push(["Gender", gender]);
  if (documentType !== "PAN" && address) rows.push(["Address", address]);
  if (documentType === "DRIVING_LICENCE") {
    if (row?.issue_date) rows.push(["Date of Issue", fmt(row.issue_date)]);
    if (row?.expiry_date) rows.push(["Valid Till", fmt(row.expiry_date)]);
  }

  let y = 215;
  for (const [label, value] of rows) {
    ctx.fillStyle = "#5b6272";
    ctx.font = "24px Arial, sans-serif";
    ctx.fillText(label, 330, y);
    ctx.fillStyle = "#101828";
    ctx.font = "600 34px Arial, sans-serif";
    const maxWidth = W - 380;
    const words = value.split(" ");
    let line = "";
    let ly = y + 42;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, 330, ly);
        ly += 42;
        line = word;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, 330, ly);
    y = ly + 54;
  }

  ctx.fillStyle = "#eaf1fb";
  ctx.fillRect(0, H - 150, W, 150);
  ctx.fillStyle = "#0b2f63";
  ctx.font = "700 58px Arial, sans-serif";
  const printedNumber =
    documentType === "AADHAAR" ? number.replace(/(\d{4})(?=\d)/g, "$1 ").trim() : number;
  ctx.fillText(printedNumber, 48, H - 80);
  ctx.fillStyle = "#a03030";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText(`SAMPLE - synthetic ${DOCUMENT_LABELS[documentType]} - not a real document`, 48, H - 30);

  return canvas.toDataURL("image/png");
}

export const UNKNOWN_PERSON_CARD = {
  name: "Rohan Sharma",
  dob: "2002-08-14",
  gender: "Male",
  address: "H.No. 221, Green Park, New Delhi, Delhi - 110016",
  documentNumber: "927531106842",
};
