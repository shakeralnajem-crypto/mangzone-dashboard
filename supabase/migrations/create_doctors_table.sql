-- Create standalone doctors table (not tied to auth.users)
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  full_name text NOT NULL,
  specialization text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic members can view doctors"
ON doctors FOR SELECT
USING (clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "admin can manage doctors"
ON doctors FOR ALL
USING (clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid()));

-- Add doctor_ref_id to appointments (references new doctors table)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_ref_id uuid REFERENCES doctors(id);

-- Index for performance
CREATE INDEX IF NOT EXISTS appointments_doctor_ref_id_idx ON appointments(doctor_ref_id);
