# GovVerify — Government Identity Verification & Risk Assessment System

> **A prototype identity verification and risk assessment platform for government verification officers, running client-side OCR and synthetic reference reconciliation.**

---

## 1. Project Overview

**GovVerify** is a full-stack web application prototype engineered to model an authorized government-office identity verification workflow. It allows verification officers to inspect citizen credentials, extract printed data using optical character recognition (OCR), cross-reference against local synthetic reference registries, check cross-document consistency for the same individual, and generate transparent, auditable risk assessment dossiers.

### Core Problem Solved

Manual identity verification at municipal or civil registration desks is susceptible to document discrepancies, expiration oversights, and cross-document inconsistencies (such as conflicting addresses or dates of birth between an Aadhaar card and a Driving Licence). GovVerify provides a structured, automated inspection pipeline that highlights discrepancies field-by-field and computes an auditable risk index before a final verification decision is rendered.

> [!NOTE]
> **Synthetic Demonstration Data Notice**
> GovVerify runs exclusively on an enclosed synthetic demonstration dataset (150 simulated citizen identities with 600 multi-document records). It is **not connected** to UIDAI, the Income Tax Department, the Election Commission of India, Parivahan, or any active state/national government database. No data processed by this system has official legal standing.

---

## 2. Key Features

- **Multi-Document Ingestion & Classification:**
  - Automated detection and manual selection for four primary Indian identity credentials:
    1. **Aadhaar Card** (12-digit Unique Identification Number)
    2. **PAN Card** (10-character Permanent Account Number)
    3. **Voter ID / EPIC Card** (10-character alphanumeric registration)
    4. **Driving Licence** (State code and issuance series)
- **Client-Side Neural OCR:**
  - In-browser optical character recognition powered by **Tesseract.js v7**.
  - Local image preprocessing (greyscale conversion, Otsu thresholding, contrast normalization).
  - Air-gapped privacy architecture: document images are processed entirely within the officer's browser memory and are never uploaded to third-party endpoints.
- **Strict Data Extraction Integrity:**
  - Unreadable or missing fields on physical documents remain blank in the inspection dossier. Synthetic reference values are never substituted for unreadable OCR fields.
- **Field-by-Field Reference Matching:**
  - Exact, partial, and mismatch state resolution for Name, Date of Birth, Document Number, Address, and Validity dates against pre-indexed reference records.
- **Cross-Document Consistency Matrix:**
  - Automatically identifies all four registered credential types linked to the citizen's unique identifier (Person ID) and checks for cross-document conflicts (e.g. name variations or mismatched dates of birth).
- **Weighted Transparent Risk Engine:**
  - Transparent heuristic scoring capped at 100 points:
    - Low Risk (0–10 pts): Consistent record with reference data
    - Medium Risk (11–40 pts): Minor variances (e.g. address mismatch or partial name)
    - High Risk (41–70 pts): Significant discrepancies (e.g. date of birth mismatch or expired credentials)
    - Critical Risk (71–100 pts): Document number mismatch or unregistered citizen
- **Audit History & Verification Dossiers:**
  - Complete chronological timeline of all pipeline events.
  - Printable official audit dossiers with masked document identifiers (`•••• •••• 1234`).
  - Searchable audit archive with filtering by citizen name, reference number, document type, and outcome status.
  - Real-time analytics dashboard with clearance rates and common risk signal frequencies.

---

## 3. Technology Stack

| Layer                   | Technologies                                                                                         |
| :---------------------- | :--------------------------------------------------------------------------------------------------- |
| **Framework**           | [TanStack Start](https://tanstack.com/start) (Full-Stack React SSR), [Nitro](https://nitro.unjs.io/) |
| **Frontend Core**       | [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/)                      |
| **Routing**             | [TanStack Router](https://tanstack.com/router) (File-based routing in `src/routes/`)                 |
| **State Management**    | [TanStack Query v5](https://tanstack.com/query)                                                      |
| **Styling & Design**    | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, Lucide React Icons                 |
| **OCR Engine**          | [Tesseract.js v7](https://tesseract.projectnaptha.com/) (WebAssembly & Web Worker)                   |
| **Storage & Data**      | In-Memory & Local Storage State, Synthetic Reference Registry (`src/lib/govverify/db.ts`)            |
| **Validation**          | [Zod](https://zod.dev/)                                                                              |
| **Runtimes & Bundlers** | [Bun](https://bun.sh/) / [Node.js](https://nodejs.org/), [Vite 8](https://vitejs.dev/)               |

---

## 4. Project Structure

```
├── AGENTS.md                  # Development guidelines and project conventions
├── README.md                  # Comprehensive project documentation
├── bunfig.toml                # Bun package manager configuration
├── components.json            # UI component registry configuration
├── package.json               # Dependencies and development scripts
├── tsconfig.json              # TypeScript compiler configuration
├── vite.config.ts             # Vite & TanStack Start build configuration
├── public/                    # Static assets (favicons, manifest)
└── src/
    ├── components/
    │   ├── govverify/         # GovVerify domain components
    │   │   ├── app-shell.tsx         # Unified dashboard layout & navigation
    │   │   ├── badges.tsx            # Crisp match, risk, and status badges
    │   │   ├── document-preview.tsx  # Document image preview card
    │   │   ├── panels.tsx            # Panel, StatCard, and FieldRow primitives
    │   │   ├── processing-steps.tsx  # Stepper component for active OCR pipeline
    │   │   ├── upload-dropzone.tsx   # Drag-and-drop document upload intake
    │   │   └── verification-views.tsx# Comparison table, timeline, cross-doc matrix
    │   └── ui/                # Reusable Radix UI & primitive elements
    ├── hooks/                 # Custom React hooks
    ├── integrations/          # Backend & authentication integrations
    │   └── supabase/          # Supabase client, types, and auth storage adapters
    ├── lib/
    │   ├── auth.tsx           # Officer session & demo credentials provider
    │   ├── error-reporting.ts # Application error boundary logging utility
    │   ├── utils.ts           # Tailwind merge & utility functions
    │   └── govverify/         # Core verification domain logic
    │       ├── db.ts                 # Synthetic reference records & verification store
    │       ├── demo-image.ts         # SVG canvas renderer for synthetic test cards
    │       ├── documentClassifier.ts # Document type identification heuristics
    │       ├── documentParser.ts     # Regex patterns for Aadhaar, PAN, Voter ID, DL
    │       ├── extraction.ts         # OCR field extraction & demo scenario loaders
    │       ├── format.ts             # Date, identifier masking, and string utilities
    │       ├── ocr.ts                # Tesseract.js worker initialization & execution
    │       ├── risk.ts               # Weighted risk index computation & rules
    │       ├── types.ts              # Domain interfaces & TypeScript types
    │       └── verification.ts       # End-to-end verification orchestrator
    ├── routes/                # TanStack Router route definitions
    │   ├── __root.tsx         # Root layout, error boundary & HTML shell
    │   ├── index.tsx          # Officer sign-in portal & demo credentials
    │   ├── dashboard.tsx      # Operational overview, stats, recent checks
    │   ├── verify.tsx         # Document upload, demo card selection & OCR runner
    │   ├── history.tsx        # Searchable verification audit archive
    │   ├── reports.tsx        # Risk analytics, outcome charts & signal incidence
    │   ├── system.tsx         # System architecture, risk weights & boundaries
    │   └── result.$verificationId.tsx # Comprehensive verification dossier view
    ├── router.tsx             # TanStack Router instance initialization
    ├── server.ts              # Server-side rendering entry point
    ├── start.ts               # TanStack Start configuration
    └── styles.css             # Design tokens, color palette, and print styles
```

---

## 5. Prerequisites & Installation

### Prerequisites

- **Node.js**: v20.0.0 or higher (or **Bun** v1.2+)
- **Package Manager**: `bun` (recommended) or `npm` / `pnpm`

### Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone git@github.com:Devcoderakash/verified-citizen-link.git
cd verified-citizen-link

# Install dependencies using Bun
bun install

# Or install dependencies using npm
npm install
```

---

## 6. Local Development

Start the local development server:

```bash
# Run with Bun
bun run dev

# Or run with npm
npm run dev
```

The application will be accessible at:

```
http://localhost:5173 (or next available port, e.g. 5174 / 5175)
```

### Demonstration Credentials

To sign in to the officer workstation, use the pre-configured prototype credentials:

- **Officer Staff ID:** `GV-1042`
- **Password:** `GovVerify#2026`
  _(A convenient one-click **"Auto-fill Demo Credentials"** button is also available directly on the sign-in screen)._

---

## 7. Environment Variables

Create a `.env` file in the root directory if connecting to an external Supabase instance (optional for prototype demonstration):

```env
# Supabase Configuration (Optional - Local storage used by default)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron Job Secret (Optional)
CRON_SECRET=your-cron-secret
```

---

## 8. Available Scripts

| Command           | Action                                                     |
| :---------------- | :--------------------------------------------------------- |
| `bun run dev`     | Starts Vite dev server with hot module replacement (HMR)   |
| `bun run build`   | Compiles client and SSR Nitro server bundle for production |
| `bun run preview` | Previews the production build locally                      |
| `bun run lint`    | Runs ESLint across the codebase                            |
| `bun run format`  | Runs Prettier to format source files                       |

---

## 9. Verification Pipeline & Risk Methodology

The verification pipeline executes sequentially through seven stages:

```
Document Image Ingestion
         ↓
Greyscale & Contrast Preprocessing
         ↓
Tesseract.js Neural OCR
         ↓
Regular Expression Attribute Parsing
         ↓
Synthetic Reference Database Matching
         ↓
Cross-Document Correlation (Aadhaar + PAN + Voter ID + DL)
         ↓
Heuristic Risk Scoring & Audit Dossier Compilation
```

### Risk Scoring Weight Breakdown

| Discrepancy Signal           | Severity Weight | Rationale                                                            |
| :--------------------------- | :-------------- | :------------------------------------------------------------------- |
| **Document Number Mismatch** | `+80 pts`       | Credential identifier does not correlate with reference record       |
| **Cross-Document Conflict**  | `+40 pts`       | Conflicting data across other credentials registered to same citizen |
| **Expired Document**         | `+35 pts`       | Document validity has elapsed                                        |
| **Date of Birth Mismatch**   | `+30 pts`       | Date on credential differs from registered demographic record        |
| **Name Mismatch**            | `+25 pts`       | Name differs from registered record                                  |
| **Address Mismatch**         | `+10 pts`       | Address variation (frequent due to migration or formatting)          |

---

## 10. Deliberately Non-Implemented Features (Prototype Boundaries)

To maintain clarity regarding prototype capabilities, the following features are intentionally non-implemented:

- **Live Government API Connectivity:** No requests are dispatched to UIDAI, NSDL, Election Commission, or Parivahan.
- **Biometric Facial Matching:** Live selfie-to-card facial recognition is not executed.
- **Physical Hologram / UV Tamper Detection:** Physical security feature inspection requires specialized optical hardware not available in standard web browsers.
- **Live Camera Scanning:** Mobile video capture is planned for Phase 2; currently, photo/scan image uploads are accepted.

---

## 11. License & Academic Prototype Disclaimer

This repository is developed as a prototype proof-of-concept demonstrating modern web architectures, client-side neural OCR, and transparent decision workflows for civil registration offices. All identity records, document images, and scores are simulated and synthetic.
