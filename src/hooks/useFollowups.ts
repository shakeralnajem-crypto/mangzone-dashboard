import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface FollowupLead extends Lead {
  category: 'overdue' | 'pending' | 'done';
}

export function useFollowups() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  const today = new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: ['followups', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('leads')
        .select('*')
        .eq('clinic_id', clinicId!)
        .not('follow_up_date', 'is', null)
        .is('deleted_at', null)
        .order('follow_up_date', { ascending: true });
      if (error) throw error;

      return (data as Lead[]).map(lead => {
        const isDone = lead.status === 'CONVERTED' || lead.status === 'LOST';
        const isOverdue = !isDone && (lead.follow_up_date ?? '') < today;
        const category: FollowupLead['category'] = isDone ? 'done' : isOverdue ? 'overdue' : 'pending';
        return { ...lead, category } as FollowupLead;
      });
    },
  });
}

export function useFollowupStats() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  const today = new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: ['followup-stats', clinicId, today],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('leads')
        .select('status, follow_up_date')
        .eq('clinic_id', clinicId!)
        .not('follow_up_date', 'is', null)
        .is('deleted_at', null);
      if (error) throw error;

      const leads = data as { status: string; follow_up_date: string | null }[];
      const total    = leads.length;
      const dueToday = leads.filter(l => l.follow_up_date === today && l.status !== 'CONVERTED' && l.status !== 'LOST').length;
      const overdue  = leads.filter(l => (l.follow_up_date ?? '') < today && l.status !== 'CONVERTED' && l.status !== 'LOST').length;
      const done     = leads.filter(l => l.status === 'CONVERTED' || l.status === 'LOST').length;

      return { total, dueToday, overdue, done };
    },
  });
}

export function useAutoGenerateFollowups() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const clinicId = profile!.clinic_id;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      // Fetch COMPLETED appointments in the last 7 days that have a patient with a phone
      const { data: appts, error: apptErr } = await db
        .from('appointments')
        .select('patient_id, patient:patients(first_name, last_name, phone)')
        .eq('clinic_id', clinicId)
        .eq('status', 'COMPLETED')
        .gte('start_time', sevenDaysAgo)
        .is('deleted_at', null)
        .not('patient_id', 'is', null);
      if (apptErr) throw apptErr;

      // Fetch existing leads (to avoid duplicates by phone)
      const { data: existingLeads } = await db
        .from('leads')
        .select('phone')
        .eq('clinic_id', clinicId)
        .is('deleted_at', null);

      const existingPhones = new Set<string>(
        (existingLeads ?? []).map((l: { phone: string | null }) => l.phone ?? '')
      );

      // Deduplicate by patient_id and only include patients with phones not already in leads
      const seen = new Set<string>();
      const toCreate: { clinic_id: string; name: string; phone: string; status: string; follow_up_date: string; notes: string; created_by: string }[] = [];

      for (const a of (appts ?? []) as { patient_id: string; patient: { first_name: string; last_name: string; phone: string | null } | null }[]) {
        if (!a.patient || !a.patient.phone) continue;
        if (seen.has(a.patient_id)) continue;
        if (existingPhones.has(a.patient.phone)) continue;
        seen.add(a.patient_id);
        toCreate.push({
          clinic_id: clinicId,
          name: `${a.patient.first_name} ${a.patient.last_name}`,
          phone: a.patient.phone,
          status: 'CONTACTED',
          follow_up_date: tomorrow,
          notes: 'Auto-generated from completed appointment',
          created_by: profile!.id,
        });
      }

      if (toCreate.length === 0) return 0;
      const { error } = await db.from('leads').insert(toCreate);
      if (error) throw error;
      return toCreate.length;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followups'] });
      qc.invalidateQueries({ queryKey: ['followup-stats'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateFollowupStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await db.from('leads').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followups'] });
      qc.invalidateQueries({ queryKey: ['followup-stats'] });
    },
  });
}
