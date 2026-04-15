import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type AppointmentWithRelations = Appointment & {
  patient: {
    first_name: string;
    last_name: string;
    phone?: string | null;
  } | null;
  doctor: { full_name: string } | null;
  doctor_ref: { full_name: string } | null;
  service: { name: string } | null;
};

function validateAppointmentTimeRange(values: Partial<AppointmentInsert>) {
  if (!values.start_time || !values.end_time) return;
  const start = new Date(values.start_time).getTime();
  const end = new Date(values.end_time).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new Error('Invalid appointment time.');
  }
  if (end <= start) {
    throw new Error('Appointment end time must be after start time.');
  }
}

export function useAppointments(filters?: {
  search?: string;
  doctorId?: string;
  status?: string;
}) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['appointments', clinicId, filters],
    enabled: !!clinicId,
    queryFn: async () => {
      let q = db
        .from('appointments')
        .select(
          `
          *,
          patient:patients(first_name, last_name, phone),
          doctor:profiles!appointments_doctor_id_fkey(full_name),
          doctor_ref:doctors!appointments_doctor_ref_id_fkey(full_name),
          service:services(name)
        `
        )
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('start_time', { ascending: false });

      if (filters?.doctorId) q = q.eq('doctor_ref_id', filters.doctorId);
      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.search?.trim()) {
        q = q.or(`walk_in_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as AppointmentWithRelations[];
    },
  });
}

export function useTodayAppointments() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  const today = new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: ['appointments', 'today', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('appointments')
        .select(
          `
          *,
          patient:patients(first_name, last_name),
          doctor:profiles!appointments_doctor_id_fkey(full_name),
          doctor_ref:doctors!appointments_doctor_ref_id_fkey(full_name),
          service:services(name)
        `
        )
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as AppointmentWithRelations[];
    },
    staleTime: 60_000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (
      values: Omit<AppointmentInsert, 'clinic_id' | 'created_by'>
    ) => {
      validateAppointmentTimeRange(values);

      const { data, error } = await db
        .from('appointments')
        .insert({
          ...values,
          clinic_id: profile!.clinic_id,
          created_by: profile!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['patient-appointments'] });
      qc.invalidateQueries({ queryKey: ['patient-summary'] });
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<AppointmentInsert>;
    }) => {
      if (!clinicId) throw new Error('Missing clinic context.');
      validateAppointmentTimeRange(values);

      const { error } = await db
        .from('appointments')
        .update(values)
        .eq('id', id)
        .eq('clinic_id', clinicId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['patient-appointments'] });
      qc.invalidateQueries({ queryKey: ['patient-summary'] });
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!clinicId) throw new Error('Missing clinic context.');
      const { error } = await db
        .from('appointments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('clinic_id', clinicId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['patient-appointments'] });
      qc.invalidateQueries({ queryKey: ['patient-summary'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!clinicId) throw new Error('Missing clinic context.');
      const { error } = await db
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .eq('clinic_id', clinicId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['patient-appointments'] });
      qc.invalidateQueries({ queryKey: ['patient-summary'] });
    },
  });
}
