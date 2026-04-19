import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface TreatmentPlan {
  id: string;
  title: string;
  name: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  patient_id: string | null;
  doctor_id: string | null;
  created_at: string;
  patient: { first_name: string; last_name: string } | null;
}

export function useTreatmentPlans() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  return useQuery({
    queryKey: ['treatment_plans', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('treatment_plans')
        .select(`*, patient:patients(first_name, last_name)`)
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TreatmentPlan[];
    },
  });
}

export function useCreateTreatmentPlan() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();
  return useMutation({
    mutationFn: async (values: { patient_id: string; doctor_id: string; title: string; start_date: string }) => {
      const { data, error } = await db
        .from('treatment_plans')
        .insert({
          clinic_id: profile!.clinic_id,
          created_by: profile!.id,
          status: 'PLANNED',
          name: values.title,
          title: values.title,
          patient_id: values.patient_id || null,
          doctor_id: values.doctor_id || null,
          start_date: values.start_date || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['treatment_plans'] }),
  });
}

export function useUpdateTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      id: string;
      patient_id?: string | null;
      doctor_id?: string | null;
      title?: string;
      status?: string;
      start_date?: string | null;
    }) => {
      const { id, title, ...rest } = values;
      const { error } = await db
        .from('treatment_plans')
        .update({ ...rest, ...(title ? { title, name: title } : {}), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['treatment_plans'] }),
  });
}

export function useDeleteTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('treatment_plans')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['treatment_plans'] }),
  });
}
