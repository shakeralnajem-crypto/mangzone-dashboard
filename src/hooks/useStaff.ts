import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Note: useCreateStaff removed — profiles has FK to auth.users, inserts require Supabase Admin API
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Doctor = Database['public']['Tables']['doctors']['Row'];
type DoctorInsert = Database['public']['Tables']['doctors']['Insert'];

// ─── Clinic Staff (non-doctor employees, no auth.users dependency) ────────────
export type StaffRole = 'RECEPTIONIST' | 'ACCOUNTANT' | 'MARKETING' | 'NURSE' | 'OTHER';

export interface ClinicStaffMember {
  id: string;
  clinic_id: string;
  full_name: string;
  role: StaffRole;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export function useClinicStaff() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  return useQuery({
    queryKey: ['clinic-staff', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('clinic_staff')
        .select('*')
        .eq('clinic_id', clinicId!)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data as ClinicStaffMember[];
    },
  });
}

export function useCreateClinicStaff() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();
  return useMutation({
    mutationFn: async (values: Omit<ClinicStaffMember, 'id' | 'clinic_id' | 'created_at'>) => {
      const { data, error } = await db
        .from('clinic_staff')
        .insert({ ...values, clinic_id: profile!.clinic_id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ClinicStaffMember;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinic-staff'] }),
  });
}

export function useUpdateClinicStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<ClinicStaffMember> & { id: string }) => {
      const { error } = await db.from('clinic_staff').update(values).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinic-staff'] }),
  });
}

export function useDeleteClinicStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('clinic_staff').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinic-staff'] }),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useStaff() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['staff', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data as Profile[];
    },
  });
}

// Fetches from the standalone doctors table (not tied to auth.users)
export function useDoctorsTable() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['doctors-table', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId!)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data as Doctor[];
    },
    staleTime: 5 * 60_000,
  });
}

// useDoctors — fetches from doctors table, returns shape compatible with dropdowns
export function useDoctors() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['doctors', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId!)
        .eq('is_active', true)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data as Doctor[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (values: Omit<DoctorInsert, 'clinic_id'>) => {
      const { data, error } = await db
        .from('doctors')
        .insert({ ...values, clinic_id: profile!.clinic_id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Doctor;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['doctors-table'] });
    },
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Doctor> & { id: string }) => {
      const { error } = await db.from('doctors').update(values).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['doctors-table'] });
    },
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('doctors').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['doctors-table'] });
    },
  });
}

export function useStaffStats() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['staff-stats', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const [apptRes, invRes] = await Promise.all([
        db.from('appointments').select('doctor_ref_id').eq('clinic_id', clinicId!).is('deleted_at', null),
        db.from('invoices').select('doctor_id, total_amount').eq('clinic_id', clinicId!).is('deleted_at', null),
      ]);
      if (apptRes.error) throw apptRes.error;
      if (invRes.error) throw invRes.error;

      const apptCounts = new Map<string, number>();
      for (const a of (apptRes.data as { doctor_ref_id: string | null }[])) {
        if (!a.doctor_ref_id) continue;
        apptCounts.set(a.doctor_ref_id, (apptCounts.get(a.doctor_ref_id) ?? 0) + 1);
      }

      const billedAmounts = new Map<string, number>();
      for (const i of (invRes.data as { doctor_id: string | null; total_amount: number }[])) {
        if (!i.doctor_id) continue;
        billedAmounts.set(i.doctor_id, (billedAmounts.get(i.doctor_id) ?? 0) + i.total_amount);
      }

      return { apptCounts, billedAmounts };
    },
  });
}

export function useToggleStaffActive() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await db
        .from('profiles')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
