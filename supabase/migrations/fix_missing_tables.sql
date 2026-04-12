-- ═══════════════════════════════════════════════════════════
-- Fix missing tables & columns — run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  service_interest text,
  source text,
  campaign text,
  status text NOT NULL DEFAULT 'NEW',
  notes text,
  converted_patient_id uuid,
  follow_up_date date,
  deleted_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic leads policy" ON leads;
CREATE POLICY "clinic leads policy" ON leads FOR ALL
  USING (clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid()));

-- 2. treatment_plans columns
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS end_date date;

-- 3. content_posts
CREATE TABLE IF NOT EXISTS content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  title text NOT NULL,
  caption text,
  hashtags text,
  platform text NOT NULL DEFAULT 'INSTAGRAM',
  post_type text NOT NULL DEFAULT 'EDUCATIONAL',
  scheduled_date date,
  status text NOT NULL DEFAULT 'IDEA',
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic content policy" ON content_posts;
CREATE POLICY "clinic content policy" ON content_posts FOR ALL
  USING (clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid()));

-- 4. clinic_staff
CREATE TABLE IF NOT EXISTS clinic_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'RECEPTIONIST',
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clinic_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic staff policy" ON clinic_staff;
CREATE POLICY "clinic staff policy" ON clinic_staff FOR ALL
  USING (clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid()));

-- 5. doctors
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  full_name text NOT NULL,
  specialization text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic doctors policy" ON doctors;
CREATE POLICY "clinic doctors policy" ON doctors FOR ALL
  USING (clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid()));

-- 6. appointments columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_ref_id uuid;
CREATE INDEX IF NOT EXISTS appointments_doctor_ref_id_idx ON appointments(doctor_ref_id);

-- 7. services deleted_at
ALTER TABLE services ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
