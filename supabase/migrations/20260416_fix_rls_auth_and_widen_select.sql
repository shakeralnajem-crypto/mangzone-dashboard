-- =============================================================================
-- Fix 1: Harden auth helper functions
-- =============================================================================
-- Change `is_active = true` → `is_active IS NOT FALSE` so that rows where
-- is_active is NULL (e.g. inserted before a NOT NULL constraint was enforced)
-- are still treated as active and auth.uid() is resolved correctly.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_auth_clinic_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT clinic_id
  FROM   profiles
  WHERE  id             = auth.uid()
    AND  is_active IS NOT FALSE
$$;

CREATE OR REPLACE FUNCTION get_auth_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT role::text
  FROM   profiles
  WHERE  id             = auth.uid()
    AND  is_active IS NOT FALSE
$$;


-- =============================================================================
-- Fix 2: Widen SELECT on invoices and payments for DOCTOR / RECEPTIONIST
-- =============================================================================
-- DOCTOR and RECEPTIONIST need to read invoice and payment data when viewing
-- the Patient Detail Modal (summary card: totalInvoiced, totalPaid, balanceDue).
-- Write access (INSERT / UPDATE / DELETE) stays ADMIN + ACCOUNTANT only.
-- =============================================================================

-- invoices SELECT
DROP POLICY IF EXISTS "invoices_select" ON invoices;
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT', 'DOCTOR', 'RECEPTIONIST')
  );

-- payments SELECT
DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments
  FOR SELECT TO authenticated
  USING (
    clinic_id = get_auth_clinic_id()
    AND get_auth_role() IN ('ADMIN', 'ACCOUNTANT', 'DOCTOR', 'RECEPTIONIST')
  );
