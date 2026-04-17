/**
 * Shared types & constants for the Appointments feature.
 * Import from here to avoid circular deps.
 */
import type { Database } from '@/types/supabase';

export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

export const APPT_STATUSES = [
  'SCHEDULED',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export type ApptStatus = (typeof APPT_STATUSES)[number];

export const STATUS_CLS: Record<ApptStatus, string> = {
  SCHEDULED:   'ds-badge ds-badge-p',
  ARRIVED:     'ds-badge ds-badge-a',
  IN_PROGRESS: 'ds-badge ds-badge-warn',
  COMPLETED:   'ds-badge ds-badge-ok',
  CANCELLED:   'ds-badge ds-badge-err',
  NO_SHOW:     'ds-badge ds-badge-neutral',
};

export const DOCTOR_COLORS = [
  'linear-gradient(135deg,#6D28D9,#8B5CF6)',
  'linear-gradient(135deg,#0891B2,#06B6D4)',
  'linear-gradient(135deg,#059669,#10B981)',
  'linear-gradient(135deg,#D97706,#F59E0B)',
  'linear-gradient(135deg,#DC2626,#EF4444)',
];

export type RichAppt = Appointment & {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    gender?: string | null;
    dob?: string | null;
    notes?: string | null;
    phone?: string | null;
  } | null;
  doctor: { full_name: string } | null;
  service: { name: string } | null;
  walk_in_name?: string | null;
  walk_in_phone?: string | null;
  doctor_ref_id?: string | null;
  notes?: string | null;
};
