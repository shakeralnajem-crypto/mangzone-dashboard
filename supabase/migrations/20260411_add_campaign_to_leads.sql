-- Add campaign column to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS campaign TEXT DEFAULT NULL;

COMMENT ON COLUMN leads.campaign IS 'Marketing campaign name that generated this lead (e.g. Summer Promo, Meta Ads)';
