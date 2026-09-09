# Citizen Verify

Build a complete, polished, hackathon-ready full-stack web application called:

"GovVerify — Government Identity Verification & Risk Assessment System"

The application is a PROTOTYPE for a government-office identity verification workflow.

IMPORTANT CONTEXT:
A government staff member uses this software to verify a citizen's government-issued identity document.

For this prototype, the supported documents are:

Aadhaar Card

PAN Card

Voter ID

Driving Licence

I have provided synthetic/sample datasets for all four document types. These datasets are ONLY mock/synthetic data for demonstration. Do NOT claim that they are connected to UIDAI, Income Tax Department, Election Commission, Parivahan, or any real government database.

The application should visually and functionally demonstrate how an authorized government verification system could work.

==================================================
CORE USER FLOW

The complete prototype flow should be:

Government Staff Login
↓
Verification Dashboard
↓
Upload Government ID Image
↓
Select/Detect Document Type
↓
Document Processing Animation
↓
Extract Citizen Information
↓
Search Verification Database
↓
Cross-Document Identity Verification
↓
Risk Assessment
↓
Detailed Verification Report
↓
Verified / Review Required / High Risk

DO NOT implement camera scanning or live camera functionality in this version.

The only input method for this prototype is:
Upload Document

However, architect the application cleanly so camera scanning can be added later without redesigning the entire system.

==================================================
DESIGN DIRECTION

Create a professional government-grade dashboard.

Visual style:

Clean

Trustworthy

Modern

Minimal

Enterprise/Government technology feel

White/light background

Deep navy/blue primary color

Subtle green for verified states

Amber/orange for warnings

Red for high-risk states

Rounded cards

Subtle shadows

Excellent spacing

Strong typography

Accessible contrast

Responsive design

Do NOT make it look like a generic AI SaaS landing page.

It should feel like an actual internal government verification portal.

Use icons from Lucide or the existing icon library.

Add subtle animations only where useful:

Upload animation

Processing steps

Progress indicator

Risk score animation

Success/error transitions

==================================================
APPLICATION STRUCTURE

Create these major screens/pages:

Login

Dashboard

New Verification

Processing

Verification Result

Verification History

Verification Detail

System/Profile page

==================================================

LOGIN PAGE
==================================================

Create a professional staff login page.

Brand:
GovVerify

Subtitle:
Government Identity Verification & Risk Assessment System

Fields:

Staff ID

Password

Button:
"Sign In"

For prototype purposes, authentication can use demo credentials.

Show a small disclaimer:

"Prototype Environment — Uses synthetic identity records for demonstration."

After successful login, redirect to Dashboard.

==================================================
2. DASHBOARD

Create a government staff dashboard.

Header:
GovVerify
Government Identity Verification Portal

Top-right:

Staff profile

Role: Verification Officer

Logout

Dashboard cards:

Total Verifications
Verified
Review Required
High Risk

Example demo values can be displayed initially.

Main CTA:

"Start New Verification"

Secondary sections:

Recent Verifications

Columns:

Verification ID

Citizen

Document

Date

Risk Level

Status

Action

Risk indicators:

LOW → green
MEDIUM → amber
HIGH → orange/red
CRITICAL → red

Also show a small "Supported Documents" section:

Aadhaar
PAN
Voter ID
Driving Licence

==================================================
3. NEW VERIFICATION PAGE

This is the primary workflow.

Title:

"New Identity Verification"

Description:

"Upload a citizen's government-issued identity document to begin verification."

Create a large drag-and-drop upload area.

Show:

📄 Upload Government ID

"Drag & drop your document here or browse files"

Supported:
JPG, JPEG, PNG, PDF

Maximum size:
10 MB

IMPORTANT:
The prototype should focus on uploaded document images.

After upload:

Show document preview.

Then show:

Document Type

Options:

Auto Detect

Aadhaar

PAN

Voter ID

Driving Licence

For the prototype, allow both:

Auto Detect

Manual selection

Button:

"Verify Document"

Before processing, show a small security/privacy notice:

"Uploaded documents are processed only for this verification prototype. Demo records are synthetic and do not represent real government databases."

==================================================
4. DOCUMENT PROCESSING

After clicking Verify Document, create a professional processing screen.

Show animated steps:

✓ Document uploaded
✓ Document type identified
⟳ Extracting information
○ Searching verification records
○ Cross-document verification
○ Calculating risk score

Use a progress indicator.

The processing should feel realistic but should be a frontend/backend prototype.

Do not fake external government API connections.

After processing, navigate automatically to Verification Result.

==================================================
5. DATA EXTRACTION

The system should represent extracted information from the uploaded document.

For the prototype, create a controlled/demo extraction mechanism.

Because the uploaded documents are sample documents, map the uploaded sample document to the corresponding synthetic database record where possible.

The architecture should separate:

Document Input
→ Extraction Layer
→ Verification Layer

This is important because a real OCR engine can later replace the prototype extraction layer.

Extract fields depending on document type.

AADHAAR:

Name

Date of Birth

Aadhaar Number

Address

Gender

PAN:

Name

Father's Name

Date of Birth

PAN Number

VOTER ID:

Name

Date of Birth

EPIC/Voter ID Number

Gender

Address

DRIVING LICENCE:

Name

Date of Birth

Licence Number

Address

Issue Date

Expiry Date

Do not expose complete sensitive-looking numbers unnecessarily in the UI.

Mask identity numbers.

Example:

XXXX XXXX 1484

==================================================
6. DATABASE / DATA MODEL

Use a proper relational database architecture.

Prefer Supabase/PostgreSQL if available.

Create these tables:

persons

id
person_id
name
dob
gender
address
created_at

documents

id
document_id
person_id
document_type
document_number
status
issue_date
expiry_date
created_at

verification_records

id
verification_id
person_id
document_id
document_type

name_match
dob_match
address_match
document_number_match
status_match
expiry_valid

face_match
tamper_indicator

risk_score
risk_level
verification_status

created_at

verification_field_results

id
verification_id
field_name
extracted_value
database_value
match_status
confidence

verification_events

id
verification_id
event_type
description
created_at

Use foreign-key relationships properly.

==================================================
7. DATASET IMPORT

I have provided four synthetic Excel datasets:

Aadhaar dataset

PAN dataset

Voter ID dataset

Driving Licence dataset

Use the provided datasets as the source for the prototype verification database.

IMPORTANT:
Do not assume these datasets are real government records.

The application should normalize them into a relational structure.

The key relationship is:

Person_ID

A single Person_ID can have multiple documents.

Example:

P001
├── Aadhaar
├── PAN
├── Voter ID
└── Driving Licence

This relationship is essential.

If the exact spreadsheet columns differ from the assumed schema, inspect the provided files and map their actual columns appropriately instead of inventing columns unnecessarily.

==================================================
8. VERIFICATION ENGINE

Create a verification engine that compares extracted document information against the synthetic database.

For example:

Extracted:

Name: Aarini Mangal
DOB: 10-12-1987

Database:

Name: Aarini Mangal
DOB: 10-12-1987

Results:

Name → MATCH
DOB → MATCH

Then retrieve all other documents associated with the same Person_ID.

Example:

Aadhaar → MATCH
PAN → MATCH
Voter ID → MATCH
Driving Licence → MATCH

==================================================
9. FIELD MATCHING

Implement field-level comparison.

Name matching:

Normalize case

Trim spaces

Handle minor formatting differences

Compare normalized strings

DOB:

Normalize date format

Exact comparison

Address:

Normalize spaces/case

Calculate similarity

Do not require exact character-by-character equality

Document number:

Normalize spaces/hyphens

Compare normalized values

Status:

Active / Inactive

Driving Licence:

Check expiry date

Every comparison should produce:

MATCH
PARTIAL MATCH
MISMATCH
NOT AVAILABLE

Show these clearly in the result.

==================================================
10. CROSS-DOCUMENT VERIFICATION

This is one of the most important features.

After finding a matching Person_ID, retrieve the citizen's other available government records.

Display:

"Cross-Document Identity Check"

Example:

┌───────────────────────────────────────┐
│ Aadhaar ✓ Verified │
│ PAN ✓ Verified │
│ Voter ID ✓ Verified │
│ Driving Licence ✓ Verified │
└───────────────────────────────────────┘

If information conflicts:

Example:

Aadhaar DOB:
10-12-1987

PAN DOB:
15-12-1987

Display:

⚠ Date of Birth Conflict

"Different DOB values found across identity records."

==================================================
11. RISK ENGINE

Create a transparent prototype risk-scoring engine.

IMPORTANT:
This is a prototype heuristic score, NOT an official government fraud probability.

Use weighted signals.

Suggested scoring:

Name mismatch: +25
DOB mismatch: +25
Document number mismatch: +20
Address mismatch: +10
Expired document: +15
Cross-document conflict: +20
Tamper indicator: +30
Face mismatch: +30

Since face verification and real tamper detection are NOT implemented in this prototype, keep them as:

"Not Available"

Do not pretend these capabilities are actually working.

Normalize the final risk score to 0–100.

Risk levels:

0–25:
LOW

26–50:
MEDIUM

51–75:
HIGH

76–100:
CRITICAL

==================================================
12. VERIFICATION RESULT PAGE

This should be the most impressive screen.

Header:

"Identity Verification Report"

Show:

Verification ID
Date & Time
Document Type
Verification Status

Then:

DOCUMENT INFORMATION

Document Type
Aadhaar

Name
Aarini Mangal

Date of Birth
10-12-1987

Document Number
XXXX XXXX 1484

DATABASE MATCH

Name ✓ MATCH
Date of Birth ✓ MATCH
Document Number ✓ MATCH
Status ✓ ACTIVE

CROSS-DOCUMENT CHECK

Aadhaar ✓
PAN ✓
Voter ID ✓
Driving Licence ✓

RISK ASSESSMENT

Risk Score

12 / 100

LOW RISK

🟢 VERIFIED

VERIFICATION DECISION

"Identity information is consistent with the available synthetic verification records."

Button:

"Download Report"

Button:

"Start New Verification"

==================================================
13. HIGH-RISK RESULT

Create a visually different high-risk state.

Example:

Risk Score:
72 / 100

HIGH RISK

⚠ MANUAL REVIEW REQUIRED

Reasons:

• Date of birth mismatch
• Cross-document inconsistency detected

Show:

Detected Value
15-12-1987

Database Value
10-12-1987

Do NOT automatically declare the citizen fraudulent.

Use language:

"Verification inconsistency detected"

"Manual review recommended"

This distinction is important.

==================================================
14. VERIFICATION HISTORY

Create a searchable table.

Columns:

Verification ID
Document Type
Citizen
Date
Risk Score
Risk Level
Status
Action

Filters:

Document Type
Risk Level
Status
Date

Search by:
Verification ID
Citizen Name

Clicking a record opens Verification Detail.

==================================================
15. VERIFICATION DETAIL

Show the complete verification report for a historical record.

Include:

Uploaded document preview

Extracted information

Database values

Field-by-field comparison

Cross-document records

Risk score

Risk reasons

Verification timeline

Timeline example:

Document Uploaded
↓
Information Extracted
↓
Database Match
↓
Cross-document Check
↓
Risk Assessment
↓
Final Decision

==================================================
16. DOCUMENT UPLOAD / DEMO DATA

For hackathon demonstration, provide a small:

"Demo Documents"

section.

Allow the staff member to select:

Demo Aadhaar — Genuine
Demo Aadhaar — DOB Mismatch
Demo PAN — Genuine
Demo Voter ID — Genuine
Demo Driving Licence — Genuine

These demo documents should connect to the synthetic database records.

This makes the demo reliable.

However, do not make the demo look fake or toy-like.

Keep the normal workflow as:

Upload Document → Verify

==================================================
17. IMPORTANT DEMO SCENARIOS

Implement at least these scenarios:

SCENARIO 1 — VERIFIED

Document:
Aadhaar

All major fields match.

Result:
LOW RISK
VERIFIED

SCENARIO 2 — DOB MISMATCH

Document:
Aadhaar

Name matches.
Document number matches.
DOB differs.

Result:
HIGH RISK
MANUAL REVIEW REQUIRED

SCENARIO 3 — CROSS-DOCUMENT CONFLICT

Aadhaar and PAN belong to same Person_ID but contain inconsistent information.

Result:
MEDIUM/HIGH RISK
CROSS-DOCUMENT INCONSISTENCY

SCENARIO 4 — EXPIRED LICENCE

Driving Licence expiry date is in the past.

Result:
WARNING
EXPIRED DOCUMENT

==================================================
18. SECURITY / PRIVACY UX

This is a government identity application.

Include appropriate UI messaging:

Sensitive information should be masked.

Do not display full Aadhaar/PAN numbers unnecessarily.

Do not expose database internals to normal staff users.

Use role-based access architecture where practical.

Do not claim real government API access.

Do not claim official verification.

Do not use real citizen data.

Add footer:

"GovVerify Prototype • Synthetic Data Environment • Not connected to government databases"

==================================================
19. RESPONSIVE DESIGN

The application must work well on:

Desktop
Laptop
Tablet

Primary target:
Government office desktop/laptop.

Desktop dashboard should use a professional sidebar navigation.

Sidebar:

Dashboard
New Verification
Verification History
Reports
System

Bottom:

Staff Profile
Logout

==================================================
20. REPORT DOWNLOAD

Implement a printable/downloadable verification report.

The report should contain:

GovVerify

Identity Verification Report

Verification ID
Date
Document Type

Extracted Information

Database Comparison

Cross-Document Verification

Risk Score

Risk Level

Reasons

Final Recommendation

For the prototype, a browser print/PDF flow is acceptable.

==================================================
21. TECHNICAL REQUIREMENTS

Use:

React
TypeScript
Tailwind CSS
shadcn/ui
Lucide icons

Use Supabase/PostgreSQL for persistent prototype data where available.

Use clean reusable components.

Suggested components:

AppSidebar
TopHeader
StatCard
UploadDropzone
DocumentPreview
ProcessingSteps
VerificationSummary
FieldComparison
CrossDocumentCard
RiskScoreCard
RiskBadge
VerificationTable
Timeline
ReportView

Use proper TypeScript types.

Do not put everything into one giant component.

Separate:

UI
Data layer
Verification logic
Risk calculation
Database operations

==================================================
22. ARCHITECTURE FOR FUTURE AI/OCR

Even though OCR is not required to be fully implemented now, structure the application so the future pipeline can become:

Document Upload
↓
Document Classification
↓
OCR
↓
Field Extraction
↓
Database Verification
↓
Cross-Document Verification
↓
Face Verification
↓
Tamper Detection
↓
Risk Engine
↓
Human Review

For this prototype:

Document Upload
↓
Demo/Prototype Extraction
↓
Database Verification
↓
Cross-Document Verification
↓
Risk Engine
↓
Human Review

Do not build fake AI functionality just for appearance.

Clearly separate currently implemented features from future capabilities.

==================================================
23. ERROR HANDLING

Handle:

Invalid file
Unsupported format
File too large
No matching record
Partial match
Multiple possible matches
Missing fields
Database error
Processing failure

Example no-match state:

"Identity record not found"

Do NOT automatically call this fraud.

Instead:

"Unable to verify against available records."

Recommendation:
"Manual verification required."

==================================================
24. EMPTY STATES

Create polished empty states for:

No verification history
No matching identity
No documents
No results

==================================================
25. FINAL UI QUALITY

The application should feel:

Professional
Reliable
Government-grade
Secure
Fast
Easy for non-technical staff

Avoid:

Excessive gradients

Neon colors

Gaming UI

Overly flashy AI effects

Fake statistics

Fake government logos

Claims of real government connectivity

The key story should be:

"Government staff uploads a citizen's ID → system verifies extracted information against authorized records → checks consistency across identity documents → calculates transparent risk → recommends verification action."

==================================================
26. HACKATHON DEMO PRIORITY

Prioritize these features above everything else:

Login

Upload Document

Document Preview

Processing

Information Extraction

Database Match

Cross-Document Verification

Risk Score

Verified / Manual Review result

Verification History

The complete flow must work smoothly without broken buttons or placeholder pages.

Create realistic synthetic demo data and make sure the end-to-end demo works.

IMPORTANT:
Do not over-engineer the prototype.

The goal is a convincing working proof-of-concept of a government identity verification platform using synthetic datasets.

Build the application end-to-end now.
First inspect the provided datasets and use their actual structure when creating the database and verification logic.
Make the UI polished enough for a hackathon presentation.
Ensure the main demo flow works from login → upload → verification → result.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://verified-citizen-link.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e9fdc9c7-6ac3-4e27-a647-dad3116b32c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
