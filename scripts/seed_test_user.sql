-- =============================================================================
-- MANGZONE — Dev Seed: Test Admin User
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to run multiple times.
--
-- NOTE: If your IDE shows syntax errors on this file, ignore them.
-- This is valid PostgreSQL — your IDE's SQL linter is set to T-SQL (SQL Server).
-- =============================================================================

-- Hardcoded UUIDs so this script is fully idempotent
-- Clinic  : aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- AuthUser: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

-- Step 1: Create the clinic
INSERT INTO public.clinics (id, name, phone, address, is_active)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Test Clinic',
  '+20100000000',
  'Cairo, Egypt',
  true
)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      is_active = true;

-- Step 2: Create the Supabase auth user
-- (includes all columns required by Supabase GoTrue v2)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user,
  is_anonymous,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('12345678', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  false,
  false,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create the profile row (links auth user → clinic with ADMIN role)
INSERT INTO public.profiles (id, clinic_id, role, full_name, is_active)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'ADMIN',
  'Admin User',
  true
)
ON CONFLICT (id) DO UPDATE
  SET role      = 'ADMIN',
      clinic_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      full_name = 'Admin User',
      is_active = true;

-- Done. Login credentials:
--   Email:    admin@test.com
--   Password: 12345678
