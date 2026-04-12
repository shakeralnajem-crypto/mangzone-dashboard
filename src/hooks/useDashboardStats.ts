import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useDashboardStats() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + '-01';

  return useQuery({
    queryKey: ['dashboard-stats', clinicId, today],
    enabled: !!clinicId,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const [patients, todayAppts, unpaidInvoices, monthPayments, newLeads, cancelledAppts] =
        await Promise.all([
          db.from('patients')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId!)
            .is('deleted_at', null),

          db.from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId!)
            .is('deleted_at', null)
            .gte('start_time', `${today}T00:00:00`)
            .lte('start_time', `${today}T23:59:59`),

          db.from('invoices')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId!)
            .is('deleted_at', null)
            .in('status', ['UNPAID', 'PARTIALLY_PAID']),

          db.from('payments')
            .select('amount')
            .eq('clinic_id', clinicId!)
            .is('deleted_at', null)
            .gte('payment_date', monthStart),

          db.from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId!)
            .is('deleted_at', null)
            .eq('status', 'NEW'),

          db.from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId!)
            .eq('status', 'CANCELLED')
            .is('deleted_at', null)
            .gte('start_time', `${today}T00:00:00`)
            .lte('start_time', `${today}T23:59:59`),
        ]);

      const monthlyRevenue = ((monthPayments.data ?? []) as { amount: number }[]).reduce(
        (sum, p) => sum + (p.amount ?? 0),
        0
      );

      return {
        totalPatients: patients.count ?? 0,
        todayAppointments: todayAppts.count ?? 0,
        unpaidInvoices: unpaidInvoices.count ?? 0,
        monthlyRevenue,
        newLeads: newLeads.count ?? 0,
        cancelledToday: cancelledAppts.count ?? 0,
      };
    },
  });
}
