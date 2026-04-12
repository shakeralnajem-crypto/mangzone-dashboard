import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Service = Database['public']['Tables']['services']['Row'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useServices() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['services', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('services')
        .select('*')
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useAllServices() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['services-all', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('services')
        .select('*')
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (values: { name: string; category?: string | null; default_price: number; duration_minutes?: number | null; is_active: boolean }) => {
      const { data, error } = await db
        .from('services')
        .insert({ ...values, clinic_id: profile!.clinic_id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Service;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      qc.invalidateQueries({ queryKey: ['services-all'] });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Service> & { id: string }) => {
      const { error } = await db.from('services').update(values).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      qc.invalidateQueries({ queryKey: ['services-all'] });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('services')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      qc.invalidateQueries({ queryKey: ['services-all'] });
    },
  });
}
