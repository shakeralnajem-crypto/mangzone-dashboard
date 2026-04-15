# Patient Summary Consistency Fix (Approved Scope)

- [x] Audit patient summary data flow and confirm plan
- [x] Implement canonical patient summary source (`src/hooks/usePatientDetail.ts`)
  - [x] Add `usePatientSummary(patientId)` with derived fields from appointments/invoices/payments tables
  - [x] Include `clinicId` in patient detail query keys to prevent cross-clinic/session cache leakage
- [x] Fix invalidation for patient summary freshness
  - [x] Invalidate patient detail + summary queries from appointment mutations (`src/hooks/useAppointments.ts`)
  - [x] Invalidate patient detail + summary queries from invoice/payment mutations (`src/hooks/useInvoices.ts`)
- [x] Wire patient modal summary to canonical source (`src/components/shared/PatientDetailModal.tsx`)
  - [x] Keep existing tabs/tables intact
  - [x] Only summary values come from `usePatientSummary`
- [ ] Run validation
  - [ ] `npm run build`
- [ ] Final report
  - [ ] files changed
  - [ ] what was fixed
  - [ ] build/typecheck result
  - [ ] remaining risks/edge cases
