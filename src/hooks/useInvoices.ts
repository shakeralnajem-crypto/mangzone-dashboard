import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function normalizeInvoiceFinancials(input: {
  total_amount: number;
  balance_due?: number | null;
  status?: InvoiceInsert['status'];
}) {
  const total = round2(input.total_amount);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error('Total amount must be greater than 0.');
  }

  const rawBalance =
    input.balance_due == null ? total : round2(input.balance_due);
  if (!Number.isFinite(rawBalance) || rawBalance < 0) {
    throw new Error('Balance due cannot be negative.');
  }

  const balance = Math.min(total, rawBalance);

  const derivedStatus: InvoiceInsert['status'] =
    balance === 0 ? 'PAID' : balance === total ? 'UNPAID' : 'PARTIALLY_PAID';

  const requested = input.status ?? derivedStatus;

  if (requested === 'PAID' && balance > 0) {
    throw new Error('Paid invoice must have zero balance due.');
  }
  if ((requested === 'UNPAID' || requested === 'DRAFT') && balance < total) {
    throw new Error('Unpaid or draft invoice must keep full balance due.');
  }
  if (requested === 'PARTIALLY_PAID' && (balance <= 0 || balance >= total)) {
    throw new Error(
      'Partially paid invoice must have remaining balance between 0 and total.'
    );
  }
  if (requested === 'CANCELLED' && balance !== total) {
    throw new Error('Cancelled invoice must keep full outstanding balance.');
  }

  return { total_amount: total, balance_due: balance, status: requested };
}

export function useInvoices(filters?: { status?: string }) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['invoices', clinicId, filters],
    enabled: !!clinicId,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any)
        .from('invoices')
        .select(
          `
          *,
          patient:patients(first_name, last_name, phone),
          doctor:profiles!invoices_doctor_id_fkey(full_name),
          payments(amount, payment_method, payment_date)
        `
        )
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status) q = q.eq('status', filters.status);

      const { data, error } = await q;
      if (error) throw error;
      return data as (Invoice & {
        patient: {
          first_name: string;
          last_name: string;
          phone: string | null;
        } | null;
        doctor: { full_name: string } | null;
        payments: {
          amount: number;
          payment_method: string;
          payment_date: string;
        }[];
      })[];
    },
  });
}

export function useBillingStats() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  return useQuery({
    queryKey: ['billing-stats', clinicId, today],
    enabled: !!clinicId,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const [invoicesRes, paymentsRes] = await Promise.all([
        db
          .from('invoices')
          .select('id, balance_due, status')
          .eq('clinic_id', clinicId!)
          .is('deleted_at', null),
        db
          .from('payments')
          .select('amount, payment_date')
          .eq('clinic_id', clinicId!)
          .is('deleted_at', null),
      ]);
      if (invoicesRes.error) throw invoicesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const invoices = invoicesRes.data as {
        id: string;
        balance_due: number;
        status: string | null;
      }[];
      const payments = paymentsRes.data as {
        amount: number;
        payment_date: string;
      }[];

      const todayRevenue = payments
        .filter((p) => p.payment_date.slice(0, 10) === today)
        .reduce((s, p) => s + p.amount, 0);
      const monthRevenue = payments
        .filter((p) => p.payment_date.slice(0, 10) >= monthStart)
        .reduce((s, p) => s + p.amount, 0);
      const pendingAmount = invoices
        .filter((i) => ['UNPAID', 'PARTIALLY_PAID'].includes(i.status ?? ''))
        .reduce((s, i) => s + i.balance_due, 0);
      const totalInvoices = invoices.length;

      return { todayRevenue, monthRevenue, pendingAmount, totalInvoices };
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useMutation({
    mutationFn: async ({
      id,
      ...values
    }: Partial<InvoiceInsert> & { id: string }) => {
      if (!clinicId) throw new Error('Missing clinic context.');

      let payload: Partial<InvoiceInsert> = { ...values };

      if (
        typeof values.total_amount === 'number' ||
        typeof values.balance_due === 'number' ||
        values.status
      ) {
        const currentRes = await (supabase as any)
          .from('invoices')
          .select('total_amount, balance_due, status')
          .eq('id', id)
          .eq('clinic_id', clinicId)
          .single();

        if (currentRes.error) throw new Error(currentRes.error.message);

        const current = currentRes.data as {
          total_amount: number;
          balance_due: number;
          status: InvoiceInsert['status'];
        };
        const normalized = normalizeInvoiceFinancials({
          total_amount:
            typeof values.total_amount === 'number'
              ? values.total_amount
              : current.total_amount,
          balance_due:
            typeof values.balance_due === 'number'
              ? values.balance_due
              : current.balance_due,
          status:
            (values.status as InvoiceInsert['status'] | undefined) ??
            current.status,
        });

        payload = { ...payload, ...normalized };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('invoices')
        .update(payload)
        .eq('id', id)
        .eq('clinic_id', clinicId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['patient-invoices'] });
      qc.invalidateQueries({ queryKey: ['patient-payments'] });
      qc.invalidateQueries({ queryKey: ['patient-summary'] });
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (
      values: Omit<InvoiceInsert, 'clinic_id' | 'created_by'>
    ) => {
      const normalized = normalizeInvoiceFinancials({
        total_amount: Number(values.total_amount),
        balance_due: values.balance_due ?? null,
        status: values.status,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('invoices')
        .insert({
          ...values,
          ...normalized,
          clinic_id: profile!.clinic_id,
          created_by: profile!.id,
          invoice_number: values.invoice_number ?? '',
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['patient-invoices'] });
      qc.invalidateQueries({ queryKey: ['patient-payments'] });
      qc.invalidateQueries({ queryKey: ['patient-summary'] });
    },
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

      const amount = round2(values.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Payment amount must be greater than 0.');
      }

      const { data: invoice, error: invErr } = await db
        .from('invoices')
        .select('id, total_amount, balance_due, status')
        .eq('id', values.invoice_id)
        .eq('clinic_id', profile!.clinic_id)
        .single();

      if (invErr) throw invErr;
      if (!invoice) throw new Error('Invoice not found.');
      if (invoice.status === 'CANCELLED')
        throw new Error('Cannot record payment on a cancelled invoice.');

      const currentBalance = round2(
        Number(invoice.balance_due ?? invoice.total_amount)
      );
      if (amount > currentBalance) {
        throw new Error('Payment amount exceeds remaining balance due.');
      }

      const { data: payment, error: pErr } = await db
        .from('payments')
        .insert({
          ...values,
          amount,
          clinic_id: profile!.clinic_id,
          collected_by: profile!.id,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      const newBalance = round2(currentBalance - amount);
      const status: InvoiceInsert['status'] =
        newBalance === 0
          ? 'PAID'
          : newBalance === round2(invoice.total_amount)
            ? 'UNPAID'
            : 'PARTIALLY_PAID';

      const { error: uErr } = await db
        .from('invoices')
        .update({ balance_due: newBalance, status })
        .eq('id', values.invoice_id)
        .eq('clinic_id', profile!.clinic_id);

      if (uErr) throw uErr;

      return payment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['patient-invoices'] });
      qc.invalidateQueries({ queryKey: ['patient-payments'] });
      qc.invalidateQueries({ queryKey: ['patient-summary'] });
    },
  });
}
