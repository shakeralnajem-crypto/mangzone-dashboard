-- Add 5 sample doctors (auto-detects clinic_id from admin profile)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  v_clinic_id uuid;
BEGIN
  -- Get clinic_id from the first admin profile
  SELECT clinic_id INTO v_clinic_id
  FROM profiles
  WHERE role = 'ADMIN'
  LIMIT 1;

  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'No admin profile found — cannot determine clinic_id';
  END IF;

  INSERT INTO doctors (clinic_id, full_name, specialization, is_active)
  VALUES
    (v_clinic_id, 'الطبيب الأول',  'طب عام الأسنان', true),
    (v_clinic_id, 'الطبيب الثاني', 'تقويم الأسنان',  true),
    (v_clinic_id, 'الطبيب الثالث', 'جراحة الفم',     true),
    (v_clinic_id, 'الطبيب الرابع', 'علاج الجذور',    true),
    (v_clinic_id, 'الطبيب الخامس', 'طب أسنان الأطفال', true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Done — 5 doctors added to clinic %', v_clinic_id;
END;
$$;
