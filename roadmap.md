# GovVerify roadmap

- [ ] Replace AI/vision reading with real Tesseract.js OCR in the browser
- [ ] Image preprocessing (resize, grayscale, contrast) before OCR
- [ ] Real OCR progress UI + raw OCR text + real confidence
- [ ] Document type detection from OCR text keywords, manual override fallback
- [ ] Field parser modules per document type (no hardcoded person)
- [ ] Database lookup from OCR fields only; no-match => IDENTITY NOT VERIFIED
- [ ] Result page: OCR data vs database record, comparison, cross-document by Person_ID
- [ ] Demo documents rendered from real DB records (genuine + modified DOB), OCR'd for real
- [ ] Test: genuine record, modified DOB, unknown person (Rohan Sharma)
