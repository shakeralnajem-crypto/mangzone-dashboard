import { TrendingUp, Users, CalendarDays, ReceiptText, AlertCircle } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatEGP } from '@/lib/currency';

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</span>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { data: stats, isLoading, error } = useDashboardStats();
  const currentMonth = new Date().toLocaleString('en-EG', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Overview for {currentMonth}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">{(error as Error).message}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Monthly Revenue */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm col-span-1 sm:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Monthly Revenue</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatEGP(stats?.monthlyRevenue)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Total payments collected this month</p>
          </div>

          {/* Patients */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Patients</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats?.totalPatients ?? '—'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Active patients in the system</p>
          </div>

          {/* Unpaid */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-orange-500">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Unpaid Invoices</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats?.unpaidInvoices ?? '—'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Awaiting collection</p>
          </div>
        </div>
      )}

      {/* Summary table */}
      {stats && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Today's Summary</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{new Date().toLocaleDateString('en-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <StatRow
              label="Appointments today"
              value={`${stats.todayAppointments}`}
              sub="scheduled for today"
            />
            <StatRow
              label="Cancelled today"
              value={`${stats.cancelledToday}`}
              sub="cancelled appointments"
            />
            <StatRow
              label="New leads"
              value={`${stats.newLeads}`}
              sub="awaiting follow-up"
            />
            <StatRow
              label="Monthly revenue"
              value={formatEGP(stats.monthlyRevenue)}
              sub={`payments in ${new Date().toLocaleString('en-EG', { month: 'long' })}`}
            />
            <StatRow
              label="Unpaid invoices"
              value={`${stats.unpaidInvoices}`}
              sub="outstanding balance"
            />
          </div>
        </div>
      )}
    </div>
  );
}
