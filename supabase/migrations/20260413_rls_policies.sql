-- =============================================================================
-- RLS Policies for main data tables
-- =============================================================================
-- Strategy to avoid recursion:
--   Both helper functions are SECURITY DEFINER with a fixed search_path.
--   They run as the function owner (postgres role), so they read profiles
--   without hitting any RLS policies on that table.
--
-- Tables covered: patients, appointments, leads, invoices, payments, expenses
-- Tables intentionally skipped: profiles (leave as-is per requirements)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1.  Helper functions
-- -----------------------------------------------------------------------------

-- Returns the clinic_id of the currently authenticated user.
-- Returns NULL when: no session, profile missing, or account is inactive.
CREATE OR REPLACE FUNCTION get_auth_clinic_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT clinic_id
  FROM   profiles
  WHERE  id        = auth.uid()
    AND  is_active = true
$$;

-- Returns the role of the currently authenticated user as text.
-- Returns NULL when: no session, profile missing, or account is inactive.
-- NULL never equals any role string, so all policies silently deny access.
CREATE OR REPLACE FUNCTION get_auth_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT role::text
  FROM   profiles
  WHERE  id        = auth.uid()
    AND  is_active = true
$$;


-- =============================================================================
-- 2.  patients
-- =============================================================================
--  ADMIN            – full access
--  DOCTOR           – SELECT / INSERT / UPDATE  (same clinic)
--  RECEPTIONIST     – SELECT / INSERT / UPDATE  (same clinic, no DELETE)
--  ACCOUNTANT       – no access
-- =============================================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;
DROP POLICY IF EXISTS "patients_delete" ON patients;

CREATE POLICY "patients_select" ON patients
  FOR SELECT TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
  );

CREATE POLICY "patients_insert" ON patients
  FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
  );

CREATE POLICY "patients_update" ON patients
  FOR UPDATE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
  )
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
  );

-- DELETE: ADMIN only (matches frontend can('delete:patient'))
CREATE POLICY "patients_delete" ON patients
  FOR DELETE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() = 'ADMIN'
  );


-- =============================================================================
-- 3.  appointments
-- =============================================================================
--  ADMIN            – full access
--  DOCTOR           – SELECT / INSERT / UPDATE / DELETE  (same clinic)
--  RECEPTIONIST     – SELECT / INSERT / UPDATE           (same clinic, no DELETE)
--  ACCOUNTANT       – no access
-- =============================================================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_delete" ON appointments;

CREATE POLICY "appointments_select" ON appointments
  FOR SELECT TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
  );

CREATE POLICY "appointments_insert" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
  );

CREATE POLICY "appointments_update" ON appointments
  FOR UPDATE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
  )
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')
  );

-- DELETE: ADMIN + DOCTOR (matches frontend can('delete:appointment'))
CREATE POLICY "appointments_delete" ON appointments
  FOR DELETE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'DOCTOR')
  );


-- =============================================================================
-- 4.  leads
-- =============================================================================
--  ADMIN            – full access
--  RECEPTIONIST     – SELECT / INSERT / UPDATE  (same clinic, no DELETE)
--  DOCTOR           – no access (leads are not a clinical record)
--  ACCOUNTANT       – no access
-- =============================================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select" ON leads;
DROP POLICY IF EXISTS "leads_insert" ON leads;
DROP POLICY IF EXISTS "leads_update" ON leads;
DROP POLICY IF EXISTS "leads_delete" ON leads;

CREATE POLICY "leads_select" ON leads
  FOR SELECT TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'RECEPTIONIST')
  );

CREATE POLICY "leads_insert" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'RECEPTIONIST')
  );

CREATE POLICY "leads_update" ON leads
  FOR UPDATE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'RECEPTIONIST')
  )
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'RECEPTIONIST')
  );

-- DELETE: ADMIN only (matches frontend can('delete:lead'))
CREATE POLICY "leads_delete" ON leads
  FOR DELETE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() = 'ADMIN'
  );


-- =============================================================================
-- 5.  invoices
-- =============================================================================
--  ADMIN            – full access
--  ACCOUNTANT       – full access  (billing is their domain)
--  DOCTOR           – no access
--  RECEPTIONIST     – no access  (billing = ADMIN + ACCOUNTANT per requirements)
-- =============================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select" ON invoices;
DROP POLICY IF EXISTS "invoices_insert" ON invoices;
DROP POLICY IF EXISTS "invoices_update" ON invoices;
DROP POLICY IF EXISTS "invoices_delete" ON invoices;

CREATE POLICY "invoices_select" ON invoices
  FOR SELECT TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  )
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );

-- DELETE: ADMIN + ACCOUNTANT (matches frontend can('delete:invoice'))
CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );


-- =============================================================================
-- 6.  payments  (invoice payment records — part of billing)
-- =============================================================================
--  Same access rules as invoices.
--  Without this, a DOCTOR could still SELECT payments directly.
-- =============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;

CREATE POLICY "payments_select" ON payments
  FOR SELECT TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );

CREATE POLICY "payments_insert" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );

CREATE POLICY "payments_update" ON payments
  FOR UPDATE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  )
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );

CREATE POLICY "payments_delete" ON payments
  FOR DELETE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );


-- =============================================================================
-- 7.  expenses
-- =============================================================================
--  ADMIN            – full access
--  ACCOUNTANT       – full access  (matches frontend can('delete:expense'))
--  DOCTOR           – no access
--  RECEPTIONIST     – no access
-- =============================================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_update" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;

CREATE POLICY "expenses_select" ON expenses
  FOR SELECT TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );

CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );

CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  )
  WITH CHECK (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );

-- DELETE: ADMIN + ACCOUNTANT (matches frontend can('delete:expense'))
CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT')
  );
