import { TrendingUp } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatEGP } from '@/lib/currency';

export function ReportsPage() {
  const { data: stats, isLoading, error } = useDashboardStats();
  const currentMonth = new Date().toLocaleString('en-EG', { month: 'long', year: 'numeric' });
  const errorMessage = error instanceof Error ? error.message : 'Failed to load reports.';

  const rows = stats
    ? [
        { label: 'Total Patients', value: String(stats.totalPatients ?? 0) },
        { label: "Today's Appointments", value: String(stats.todayAppointments ?? 0) },
        { label: 'Unpaid Invoices', value: String(stats.unpaidInvoices ?? 0) },
        { label: 'New Leads', value: String(stats.newLeads ?? 0) },
        { label: 'Cancelled Today', value: String(stats.cancelledToday ?? 0) },
        { label: 'Monthly Revenue', value: formatEGP(stats.monthlyRevenue) },
      ]
    : [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Overview for {currentMonth}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <TrendingUp className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400">No report data available.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Metric</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{row.label}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
