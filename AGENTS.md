# GovVerify — Developer & Agent Guidelines

## Project Overview

GovVerify is a government-grade identity verification and risk assessment platform prototype. It allows authorized verification staff to inspect citizen identity documents (Aadhaar, PAN, Voter ID, and Driving Licence), perform client-side OCR extraction, cross-reference against local synthetic reference datasets, verify cross-document consistency, and generate transparent risk assessments.

## Architecture & Technology Stack

- **Framework:** TanStack Start (SSR) with React 19 and Vite
- **Routing:** TanStack Router (`src/routes/`)
- **Styling:** Tailwind CSS v4, Lucide React icons, Radix UI primitives
- **OCR Engine:** Tesseract.js (in-browser client OCR)
- **Data & State:** TanStack Query, IndexedDB / local storage for prototype verification records, synthetic reference database (`src/lib/govverify/db.ts`)
- **Type Safety:** TypeScript, Zod schemas

## Development Conventions

- **Functionality First:** Never break existing OCR pipelines, synthetic matching algorithms, or verification calculations.
- **Visual Design:** Maintain a human-designed, official government portal aesthetic (Navy `#0f2942` primary, crisp slate neutral surfaces, semantic green/amber/red indicator badges, strong accessible contrast).
- **Security & Privacy:** Avoid storing raw document images permanently; all reference datasets are strictly synthetic demonstrations.
