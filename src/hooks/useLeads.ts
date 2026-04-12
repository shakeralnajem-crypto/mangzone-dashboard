import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useLeads(filters?: { search?: string; status?: string }) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['leads', clinicId, filters],
    enabled: !!clinicId,
    queryFn: async () => {
      let q = db
        .from('leads')
        .select('*')
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'ALL') q = q.eq('status', filters.status);
      if (filters?.search?.trim()) {
        q = q.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useOverdueLeads() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  const today = new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: ['leads', 'overdue', clinicId, today],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('leads')
        .select('*')
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .lte('follow_up_date', today)
        .not('status', 'in', '("CONVERTED","LOST")')
        .order('follow_up_date', { ascending: true });
      if (error) throw error;
      return data as Lead[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (values: Omit<LeadInsert, 'clinic_id' | 'created_by'>) => {
      const { data, error } = await db
        .from('leads')
        .insert({ ...values, clinic_id: profile!.clinic_id, created_by: profile!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...values }: LeadUpdate & { id: string }) => {
      const { error } = await db
        .from('leads')
        .update(values)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Lead['status'] }) => {
      const { error } = await db.from('leads').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('leads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (lead: Lead) => {
      const [firstName, ...rest] = lead.name.trim().split(' ');
      const { data: patient, error: pErr } = await db
        .from('patients')
        .insert({
          clinic_id: profile!.clinic_id,
          first_name: firstName,
          last_name: rest.join(' ') || '-',
          phone: lead.phone,
          notes: lead.notes,
          created_by: profile!.id,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      const { error: lErr } = await db
        .from('leads')
        .update({ status: 'CONVERTED', converted_patient_id: patient.id })
        .eq('id', lead.id);
      if (lErr) throw lErr;

      return patient;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
