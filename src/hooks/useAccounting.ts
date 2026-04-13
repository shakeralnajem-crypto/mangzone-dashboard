import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Expense = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── Expenses ────────────────────────────────────────────────────────────────

export function useExpenses(year?: number, month?: number) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['expenses', clinicId, year, month],
    enabled: !!clinicId,
    queryFn: async () => {
      let q = db
        .from('expenses')
        .select('*')
        .eq('clinic_id', clinicId!)
        .order('expense_date', { ascending: false });

      if (year && month) {
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const end = new Date(year, month, 0).toISOString().slice(0, 10);
        q = q.gte('expense_date', start).lte('expense_date', end);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (values: Omit<ExpenseInsert, 'clinic_id' | 'created_by'>) => {
      const { data, error } = await db
        .from('expenses')
        .insert({ ...values, clinic_id: profile!.clinic_id, created_by: profile!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<ExpenseInsert> & { id: string }) => {
      const { error } = await db.from('expenses').update(values).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

// ─── Doctor Dues ─────────────────────────────────────────────────────────────

export interface DoctorDueRow {
  doctorId: string;
  doctorName: string;
  totalBilled: number;
  clinicShare: number;
  doctorDue: number;
  invoiceCount: number;
}

export function useDoctorDues(clinicPercent = 30) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  const doctorPercent = 100 - clinicPercent;

  return useQuery({
    queryKey: ['doctor-dues', clinicId, clinicPercent],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data: invoices, error } = await db
        .from('invoices')
        .select('total_amount, doctor_id, doctor:profiles!invoices_doctor_id_fkey(full_name)')
        .eq('clinic_id', clinicId!)
        .eq('status', 'PAID')
        .is('deleted_at', null)
        .not('doctor_id', 'is', null);

      if (error) throw error;

      // Group by doctor_id
      const map = new Map<string, DoctorDueRow>();
      for (const inv of invoices as { total_amount: number; doctor_id: string; doctor: { full_name: string } | null }[]) {
        const id = inv.doctor_id;
        const name = inv.doctor?.full_name ?? 'Unknown';
        const existing = map.get(id);
        if (existing) {
          existing.totalBilled += inv.total_amount;
          existing.invoiceCount += 1;
          existing.clinicShare = existing.totalBilled * (clinicPercent / 100);
          existing.doctorDue = existing.totalBilled * (doctorPercent / 100);
        } else {
          map.set(id, {
            doctorId: id,
            doctorName: name,
            totalBilled: inv.total_amount,
            clinicShare: inv.total_amount * (clinicPercent / 100),
            doctorDue: inv.total_amount * (doctorPercent / 100),
            invoiceCount: 1,
          });
        }
      }
      return Array.from(map.values());
    },
  });
}

// ─── Monthly Report ───────────────────────────────────────────────────────────

export interface MonthlyReport {
  revenue: number;
  expenses: number;
  netProfit: number;
  invoiceCount: number;
  paidCount: number;
  unpaidCount: number;
  weeklyRevenue: { week: string; revenue: number; expenses: number }[];
}

export function useMonthlyReport(year: number, month: number) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['monthly-report', clinicId, year, month],
    enabled: !!clinicId,
    queryFn: async (): Promise<MonthlyReport> => {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const [paymentsRes, expensesRes, invoicesRes] = await Promise.all([
        db.from('payments')
          .select('amount, payment_date')
          .eq('clinic_id', clinicId!)
          .is('deleted_at', null)
          .gte('payment_date', start)
          .lte('payment_date', end),
        db.from('expenses')
          .select('amount, expense_date')
          .eq('clinic_id', clinicId!)
          .gte('expense_date', start)
          .lte('expense_date', end),
        db.from('invoices')
          .select('status')
          .eq('clinic_id', clinicId!)
          .is('deleted_at', null)
          .gte('created_at', `${start}T00:00:00`)
          .lte('created_at', `${end}T23:59:59`),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (invoicesRes.error) throw invoicesRes.error;

      const payments = paymentsRes.data as { amount: number; payment_date: string }[];
      const expenseList = expensesRes.data as { amount: number; expense_date: string }[];
      const invoices = invoicesRes.data as { status: string }[];

      const revenue = payments.reduce((s, p) => s + p.amount, 0);
      const expenses = expenseList.reduce((s, e) => s + e.amount, 0);

      // Build weekly buckets (4 weeks)
      const weeks = [
        { week: 'Week 1', days: [1, 7] },
        { week: 'Week 2', days: [8, 14] },
        { week: 'Week 3', days: [15, 21] },
        { week: 'Week 4', days: [22, lastDay] },
      ];

      const weeklyRevenue = weeks.map(({ week, days }) => {
        const wRev = payments
          .filter(p => {
            const d = parseInt(p.payment_date.slice(8, 10), 10);
            return d >= days[0] && d <= days[1];
          })
          .reduce((s, p) => s + p.amount, 0);
        const wExp = expenseList
          .filter(e => {
            const d = parseInt(e.expense_date.slice(8, 10), 10);
            return d >= days[0] && d <= days[1];
          })
          .reduce((s, e) => s + e.amount, 0);
        return { week, revenue: wRev, expenses: wExp };
      });

      return {
        revenue,
        expenses,
        netProfit: revenue - expenses,
        invoiceCount: invoices.length,
        paidCount: invoices.filter(i => i.status === 'PAID').length,
        unpaidCount: invoices.filter(i => ['UNPAID', 'PARTIALLY_PAID'].includes(i.status)).length,
        weeklyRevenue,
      };
    },
  });
}
