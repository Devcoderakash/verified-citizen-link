import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  imageDataUrl: z.string().min(32),
  fileName: z.string().min(1),
});

const SYSTEM = `You read government-issued Indian identity document images and return the printed values.
Return STRICT JSON only, no prose, with this exact shape:
{"documentType":"AADHAAR"|"PAN"|"VOTER_ID"|"DRIVING_LICENCE"|"UNKNOWN","name":string|null,"dob":"YYYY-MM-DD"|null,"documentNumber":string|null,"address":string|null,"gender":"Male"|"Female"|"Other"|null,"fatherName":string|null,"issueDate":"YYYY-MM-DD"|null,"expiryDate":"YYYY-MM-DD"|null}
Copy values exactly as printed. Convert DD/MM/YYYY dates to YYYY-MM-DD. Use null when a field is absent or unreadable. Never invent values.`;

export interface ReadDocumentResult {
  documentType: "AADHAAR" | "PAN" | "VOTER_ID" | "DRIVING_LICENCE" | "UNKNOWN";
  name: string | null;
  dob: string | null;
  documentNumber: string | null;
  address: string | null;
  gender: string | null;
  fatherName: string | null;
  issueDate: string | null;
  expiryDate: string | null;
}

export const readDocumentImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ReadDocumentResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Document reading is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: `Read this identity document image (file: ${data.fileName}).` },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Document reading is rate limited. Please retry shortly.");
    if (res.status === 402) throw new Error("Document reading credits are exhausted.");
    if (!res.ok) throw new Error(`Document could not be read (${res.status}).`);

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = /\{[\s\S]*\}/.exec(raw);
    if (!match) throw new Error("The document text could not be read from this image.");
    return JSON.parse(match[0]) as ReadDocumentResult;
  });
