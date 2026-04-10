import type { Database } from './supabase';

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Clinic = Database['public']['Tables']['clinics']['Row'];
export type Patient = Database['public']['Tables']['patients']['Row'];

// Enum types
export type UserRole = Database['public']['Enums']['user_role'];
export type GenderEnum = Database['public']['Enums']['gender_enum'];
export type AppointmentStatus = Database['public']['Enums']['appointment_status'];
export type TreatmentStatus = Database['public']['Enums']['treatment_status'];
export type InvoiceStatus = Database['public']['Enums']['invoice_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];

// Auth session type used across the app
export interface AuthSession {
  userId: string;
  profile: Profile;
}
