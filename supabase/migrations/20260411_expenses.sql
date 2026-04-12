-- Expenses table for accounting module
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  category        TEXT NOT NULL CHECK (category IN ('Rent','Salaries','Supplies','Equipment','Marketing','Utilities','Other')),
  description     TEXT,
  amount          NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  expense_date    DATE NOT NULL,
  paid_to         TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for clinic + date filtering
CREATE INDEX IF NOT EXISTS expenses_clinic_date_idx ON expenses (clinic_id, expense_date DESC);

-- RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage their expenses"
  ON expenses
  FOR ALL
  USING (clinic_id = get_auth_clinic_id())
  WITH CHECK (clinic_id = get_auth_clinic_id());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expenses_updated_at ON expenses;
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
