import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type AppointmentWithRelations = Appointment & {
  patient: { first_name: string; last_name: string; phone?: string | null } | null;
  doctor: { full_name: string } | null;
  doctor_ref: { full_name: string } | null;
  service: { name: string } | null;
};

export function useAppointments(filters?: { search?: string; doctorId?: string; status?: string }) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['appointments', clinicId, filters],
    enabled: !!clinicId,
    queryFn: async () => {
      let q = db
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, phone),
          doctor:profiles!appointments_doctor_id_fkey(full_name),
          doctor_ref:doctors!appointments_doctor_ref_id_fkey(full_name),
          service:services(name)
        `)
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('start_time', { ascending: false });

      if (filters?.doctorId) q = q.eq('doctor_ref_id', filters.doctorId);
      if (filters?.status)   q = q.eq('status', filters.status);
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
        .select(`
          *,
          patient:patients(first_name, last_name),
          doctor:profiles!appointments_doctor_id_fkey(full_name),
          doctor_ref:doctors!appointments_doctor_ref_id_fkey(full_name),
          service:services(name)
        `)
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
    mutationFn: async (values: Omit<AppointmentInsert, 'clinic_id' | 'created_by'>) => {
      const { data, error } = await db
        .from('appointments')
        .insert({ ...values, clinic_id: profile!.clinic_id, created_by: profile!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<AppointmentInsert> }) => {
      const { error } = await db
        .from('appointments')
        .update(values)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('appointments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await db
        .from('appointments')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}
