import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

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
          // Total active patients
          supabase
            .from('patients')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId!)
            .is('deleted_at', null),

          // Today's appointments
          supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId!)
            .is('deleted_at', null)
            .gte('start_time', `${today}T00:00:00`)
            .lte('start_time', `${today}T23:59:59`),

          // Unpaid invoices
          supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId!)
            .is('deleted_at', null)
            .in('status', ['UNPAID', 'PARTIALLY_PAID']),

          // Monthly revenue (sum of payments this month)
          supabase
            .from('payments')
            .select('amount')
            .eq('clinic_id', clinicId!)
            .is('deleted_at', null)
            .gte('payment_date', `${monthStart}T00:00:00`),

          // New leads
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId!)
            .is('deleted_at', null)
            .eq('status', 'NEW'),

          // Today cancelled
          supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId!)
            .eq('status', 'CANCELLED')
            .is('deleted_at', null)
            .gte('start_time', `${today}T00:00:00`)
            .lte('start_time', `${today}T23:59:59`),
        ]);

      const monthlyRevenue = (monthPayments.data ?? []).reduce(
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
