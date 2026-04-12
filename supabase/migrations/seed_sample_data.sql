-- Run this in Supabase SQL editor to add sample services and verify setup
-- Replace 'YOUR_CLINIC_ID' with your actual clinic_id from the profiles table

-- First, find your clinic_id:
-- SELECT clinic_id FROM profiles WHERE role = 'ADMIN' LIMIT 1;

-- Add sample services (replace YOUR_CLINIC_ID):
INSERT INTO services (clinic_id, name, category, default_price, duration_minutes, is_active)
VALUES
  ('YOUR_CLINIC_ID', 'فحص أسنان', 'فحص', 150, 30, true),
  ('YOUR_CLINIC_ID', 'تنظيف أسنان', 'وقاية', 300, 45, true),
  ('YOUR_CLINIC_ID', 'حشو عادي', 'علاج', 400, 60, true),
  ('YOUR_CLINIC_ID', 'خلع سن', 'جراحة', 250, 30, true),
  ('YOUR_CLINIC_ID', 'تركيب تاج زركون', 'تجميل', 2500, 90, true)
ON CONFLICT DO NOTHING;
