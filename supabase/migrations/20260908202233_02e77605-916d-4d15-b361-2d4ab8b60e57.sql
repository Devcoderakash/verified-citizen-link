CREATE TABLE public.persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL UNIQUE,
  person_id TEXT NOT NULL REFERENCES public.persons(person_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  issue_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_person ON public.documents(person_id);
CREATE INDEX idx_documents_number ON public.documents(document_number);

CREATE TABLE public.verification_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id TEXT NOT NULL UNIQUE,
  person_id TEXT REFERENCES public.persons(person_id) ON DELETE SET NULL,
  document_id TEXT REFERENCES public.documents(document_id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  citizen_name TEXT,
  officer_name TEXT,
  source_file_name TEXT,
  extracted JSONB NOT NULL DEFAULT '{}'::jsonb,
  cross_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  name_match TEXT,
  dob_match TEXT,
  address_match TEXT,
  document_number_match TEXT,
  status_match TEXT,
  expiry_valid TEXT,
  face_match TEXT NOT NULL DEFAULT 'NOT_AVAILABLE',
  tamper_indicator TEXT NOT NULL DEFAULT 'NOT_AVAILABLE',
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  verification_status TEXT NOT NULL DEFAULT 'VERIFIED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vr_created ON public.verification_records(created_at DESC);

CREATE TABLE public.verification_field_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id TEXT NOT NULL REFERENCES public.verification_records(verification_id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  extracted_value TEXT,
  database_value TEXT,
  match_status TEXT NOT NULL,
  confidence NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vfr_vid ON public.verification_field_results(verification_id);

CREATE TABLE public.verification_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id TEXT NOT NULL REFERENCES public.verification_records(verification_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ve_vid ON public.verification_events(verification_id);

GRANT SELECT ON public.persons TO anon, authenticated;
GRANT SELECT ON public.documents TO anon, authenticated;
GRANT SELECT, INSERT ON public.verification_records TO anon, authenticated;
GRANT SELECT, INSERT ON public.verification_field_results TO anon, authenticated;
GRANT SELECT, INSERT ON public.verification_events TO anon, authenticated;
GRANT ALL ON public.persons, public.documents, public.verification_records, public.verification_field_results, public.verification_events TO service_role;

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_field_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persons_read" ON public.persons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "documents_read" ON public.documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "vr_read" ON public.verification_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "vr_insert" ON public.verification_records FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "vfr_read" ON public.verification_field_results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "vfr_insert" ON public.verification_field_results FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "ve_read" ON public.verification_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ve_insert" ON public.verification_events FOR INSERT TO anon, authenticated WITH CHECK (true);