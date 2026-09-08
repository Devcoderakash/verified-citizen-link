/**
 * DOCUMENT PARSER — turns raw OCR text into structured fields.
 * Anything the OCR text does not contain stays null; nothing is invented
 * and nothing is ever taken from the reference database here.
 */
import type { DocumentType } from "./types";

export interface ParsedFields {
  name: string | null;
  dob: string | null; // ISO yyyy-mm-dd
  documentNumber: string | null;
  gender: string | null;
  address: string | null;
  fatherName: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  missing: string[];
}

const NOISE = [
  "government of india",
  "unique identification authority of india",
  "income tax department",
  "election commission of india",
  "elector photo identity card",
  "permanent account number",
  "transport department",
  "driving licence",
  "driving license",
  "sample",
  "qr code",
  "not a real",
];

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function isNoise(line: string): boolean {
  const l = line.toLowerCase();
  return NOISE.some((n) => l.includes(n));
}

function toIso(day: string, month: string, year: string): string | null {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year.length === 2 ? `19${year}` : year);
  if (!d || !m || !y || d > 31 || m > 12) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** All dd/mm/yyyy (or dd-mm-yyyy, yyyy-mm-dd) dates in the order they appear. */
export function findDates(text: string): { iso: string; index: number; raw: string }[] {
  const out: { iso: string; index: number; raw: string }[] = [];
  const dmy = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = dmy.exec(text))) {
    const iso = toIso(m[1]!, m[2]!, m[3]!);
    if (iso) out.push({ iso, index: m.index, raw: m[0] });
  }
  const ymd = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  while ((m = ymd.exec(text))) {
    out.push({ iso: `${m[1]}-${m[2]}-${m[3]}`, index: m.index, raw: m[0] });
  }
  return out.sort((a, b) => a.index - b.index);
}

function labelledValue(ls: string[], labels: string[]): string | null {
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i]!.toLowerCase();
    if (!labels.some((lab) => l.startsWith(lab) || l.includes(`${lab} /`) || l.includes(`${lab}:`)))
      continue;
    // Value on the same line after ":" or "/"
    const inline = ls[i]!.split(/[:|]/).slice(1).join(":").trim();
    if (inline && !/^[\u0900-\u097F\s/]+$/.test(inline) && inline.length > 1) return inline;
    // Otherwise the next non-noise line
    for (let j = i + 1; j < Math.min(ls.length, i + 3); j++) {
      const cand = ls[j]!;
      if (!cand || isNoise(cand)) continue;
      if (/^[\u0900-\u097F\s/]+$/.test(cand)) continue;
      return cand;
    }
  }
  return null;
}

function cleanName(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/[\u0900-\u097F]/g, "")
    .replace(/[^A-Za-z .'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 3) return null;
  const words = cleaned.split(" ").filter((w) => w.length > 1);
  if (!words.length) return null;
  return words.slice(0, 5).join(" ");
}

function findName(ls: string[], text: string): string | null {
  const labelled = cleanName(labelledValue(ls, ["name", "नाम", "नम"]));
  if (labelled) return labelled;
  // Fall back to the line immediately before the first date.
  const dates = findDates(text);
  if (dates.length) {
    const upto = text.slice(0, dates[0]!.index);
    const prior = lines(upto).reverse();
    for (const l of prior) {
      if (isNoise(l)) continue;
      const n = cleanName(l);
      if (n && /^[A-Za-z][A-Za-z .'-]+$/.test(n)) return n;
    }
  }
  return null;
}

function findGender(text: string): string | null {
  const t = text.toLowerCase();
  if (/\bfemale\b|महिला/.test(t)) return "Female";
  if (/\bmale\b|पुरुष/.test(t)) return "Male";
  if (/\btransgender\b/.test(t)) return "Transgender";
  return null;
}

function findAddress(ls: string[]): string | null {
  const idx = ls.findIndex((l) => /^address\b|पता/i.test(l));
  if (idx === -1) return null;
  const parts: string[] = [];
  const inline = ls[idx]!.replace(/^address\s*[/:]?\s*(पता)?\s*[:/]?\s*/i, "").trim();
  if (inline && !/^[\u0900-\u097F\s/]+$/.test(inline)) parts.push(inline);
  for (let j = idx + 1; j < Math.min(ls.length, idx + 5); j++) {
    const l = ls[j]!;
    if (!l || isNoise(l)) break;
    if (/^\d[\d\s]{9,}$/.test(l)) break; // Aadhaar number block
    if (/^(dob|date of birth|gender|लिंग)/i.test(l)) break;
    parts.push(l.replace(/[\u0900-\u097F]/g, "").trim());
  }
  const addr = parts.join(", ").replace(/\s*,\s*,+/g, ", ").replace(/\s+/g, " ").trim();
  return addr.length > 5 ? addr.replace(/[,\s]+$/, "") : null;
}

function findNumber(type: DocumentType, text: string): string | null {
  const upper = text.toUpperCase();
  if (type === "AADHAAR") {
    const m = /\b(\d{4})\s?(\d{4})\s?(\d{4})\b/.exec(upper.replace(/[OO]/g, "0"));
    return m ? `${m[1]}${m[2]}${m[3]}` : null;
  }
  if (type === "PAN") {
    const m = /\b([A-Z]{5}\s?\d{4}\s?[A-Z])\b/.exec(upper);
    return m ? m[1]!.replace(/\s/g, "") : null;
  }
  if (type === "VOTER_ID") {
    const m = /\b([A-Z]{3}\s?\d{7})\b/.exec(upper);
    return m ? m[1]!.replace(/\s/g, "") : null;
  }
  const dl = /\b([A-Z]{2}[-\s]?\d{2}[-\s]?\d{6,14})\b/.exec(upper);
  return dl ? dl[1]!.replace(/\s/g, "").replace(/-/g, "-") : null;
}

export function parseDocument(type: DocumentType, rawText: string): ParsedFields {
  const ls = lines(rawText);
  const dates = findDates(rawText);

  const name = findName(ls, rawText);
  const documentNumber = findNumber(type, rawText);
  const gender = type === "PAN" ? null : findGender(rawText);
  const address = type === "PAN" ? null : findAddress(ls);

  // The first date printed on these documents is the date of birth.
  const dob = dates[0]?.iso ?? null;
  let issueDate: string | null = null;
  let expiryDate: string | null = null;
  if (type === "DRIVING_LICENCE") {
    issueDate = dates[1]?.iso ?? null;
    expiryDate = dates[2]?.iso ?? null;
  }

  const fatherName =
    type === "PAN" ? cleanName(labelledValue(ls, ["father", "father's name", "पिता"])) : null;

  const missing: string[] = [];
  if (!name) missing.push("Name");
  if (!dob) missing.push("Date of Birth");
  if (!documentNumber) missing.push("Document Number");

  return { name, dob, documentNumber, gender, address, fatherName, issueDate, expiryDate, missing };
}
