-- =============================================================================
-- MANGZONE — Migration: Leads / Inquiries Table
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name                  VARCHAR(255) NOT NULL,
  phone                 VARCHAR(50),
  service_interest      VARCHAR(255),
  source                VARCHAR(100),   -- 'phone','walk-in','whatsapp','instagram','referral'
  status                VARCHAR(50)  NOT NULL DEFAULT 'NEW',  -- NEW,CONTACTED,INTERESTED,CONVERTED,LOST
  notes                 TEXT,
  converted_patient_id  UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  follow_up_date        DATE,
  deleted_at            TIMESTAMPTZ,
  created_by            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_clinic_id ON public.leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_leads_status    ON public.leads(status);

-- updated_at trigger
CREATE TRIGGER update_leads_modtime
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic access for leads"
  ON public.leads FOR ALL
  USING (clinic_id = get_auth_clinic_id());
