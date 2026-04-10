import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];

export function useInvoices(filters?: { status?: string }) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['invoices', clinicId, filters],
    enabled: !!clinicId,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any)
        .from('invoices')
        .select(`
          *,
          patient:patients(first_name, last_name, phone),
          doctor:profiles!invoices_doctor_id_fkey(full_name),
          payments(amount, payment_method, payment_date)
        `)
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status) q = q.eq('status', filters.status);

      const { data, error } = await q;
      if (error) throw error;
      return data as (Invoice & {
        patient: { first_name: string; last_name: string; phone: string | null } | null;
        doctor: { full_name: string } | null;
        payments: { amount: number; payment_method: string; payment_date: string }[];
      })[];
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (
      values: Omit<InvoiceInsert, 'clinic_id' | 'created_by' | 'invoice_number'>
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('invoices')
        .insert({
          ...values,
          clinic_id: profile!.clinic_id,
          created_by: profile!.id,
          invoice_number: '',
        })
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (values: {
      invoice_id: string;
      amount: number;
      payment_method: string;
      payment_date: string;
      notes?: string | null;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const { data: payment, error: pErr } = await db
        .from('payments')
        .insert({
          ...values,
          clinic_id: profile!.clinic_id,
          collected_by: profile!.id,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      // Recalculate balance_due
      const { data: inv } = await db
        .from('invoices')
        .select('total_amount, payments(amount)')
        .eq('id', values.invoice_id)
        .single();

      if (inv) {
        const paid = (inv.payments as { amount: number }[]).reduce((s: number, p: { amount: number }) => s + p.amount, 0);
        const balance = inv.total_amount - paid;
        const status = balance <= 0 ? 'PAID' : 'PARTIALLY_PAID';
        await db
          .from('invoices')
          .update({ balance_due: Math.max(0, balance), status })
          .eq('id', values.invoice_id);
      }

      return payment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
