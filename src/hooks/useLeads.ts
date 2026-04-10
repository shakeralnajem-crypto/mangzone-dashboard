import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export function useLeads(filters?: { search?: string; status?: string }) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['leads', clinicId, filters],
    enabled: !!clinicId,
    queryFn: async () => {
      let q = supabase
        .from('leads')
        .select('*')
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.search?.trim()) {
        q = q.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (values: Omit<LeadInsert, 'clinic_id' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...values, clinic_id: profile!.clinic_id, created_by: profile!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Lead['status'] }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

/** Convert a lead to a patient and mark it CONVERTED */
export function useConvertLead() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (lead: Lead) => {
      // 1. Create patient
      const [firstName, ...rest] = lead.name.trim().split(' ');
      const { data: patient, error: pErr } = await supabase
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

      // 2. Mark lead converted
      const { error: lErr } = await supabase
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
