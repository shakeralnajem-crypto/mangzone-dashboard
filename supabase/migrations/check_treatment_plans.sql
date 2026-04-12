-- Run this in Supabase SQL editor to add description if you want it:
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS description text;
-- OR if you don't want it, the code fix above removes it from the app side
