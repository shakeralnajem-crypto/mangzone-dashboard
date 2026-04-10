import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTodayAppointments } from '@/hooks/useAppointments';
import { formatEGP } from '@/lib/currency';
import {
  Users,
  CalendarDays,
  ReceiptText,
  TrendingUp,
  AlertCircle,
  Clock,
  Megaphone,
} from 'lucide-react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  isLoading?: boolean;
}

function StatCard({ icon: Icon, label, value, color, isLoading }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-sm">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-7 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        ) : (
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { i18n } = useTranslation();
  const { profile } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todayAppts = [], isLoading: apptsLoading } = useTodayAppointments();
  const isRtl = i18n.language === 'ar';

  const greeting = isRtl
    ? `مرحباً، ${profile?.full_name ?? ''}`
    : `Welcome back, ${profile?.full_name ?? ''}`;

  const statCards: StatCardProps[] = [
    {
      icon: Users,
      label: isRtl ? 'إجمالي المرضى' : 'Total Patients',
      value: stats?.totalPatients ?? '—',
      color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      isLoading: statsLoading,
    },
    {
      icon: CalendarDays,
      label: isRtl ? 'مواعيد اليوم' : "Today's Appointments",
      value: stats?.todayAppointments ?? '—',
      color: 'bg-gradient-to-br from-fuchsia-500 to-pink-500',
      isLoading: statsLoading,
    },
    {
      icon: ReceiptText,
      label: isRtl ? 'فواتير مستحقة' : 'Unpaid Invoices',
      value: stats?.unpaidInvoices ?? '—',
      color: 'bg-gradient-to-br from-amber-400 to-orange-500',
      isLoading: statsLoading,
    },
    {
      icon: TrendingUp,
      label: isRtl ? 'إيرادات الشهر' : 'Monthly Revenue',
      value: stats ? formatEGP(stats.monthlyRevenue) : '—',
      color: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      isLoading: statsLoading,
    },
    {
      icon: Megaphone,
      label: isRtl ? 'عملاء جدد' : 'New Leads',
      value: stats?.newLeads ?? '—',
      color: 'bg-gradient-to-br from-blue-400 to-cyan-500',
      isLoading: statsLoading,
    },
    {
      icon: AlertCircle,
      label: isRtl ? 'ملغي اليوم' : 'Cancelled Today',
      value: stats?.cancelledToday ?? '—',
      color: 'bg-gradient-to-br from-red-400 to-rose-500',
      isLoading: statsLoading,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{greeting}</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Today's appointments */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-600" />
            {isRtl ? 'مواعيد اليوم' : "Today's Schedule"}
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-EG')}
          </span>
        </div>

        {apptsLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : todayAppts.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-200 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {isRtl ? 'لا توجد مواعيد اليوم' : 'No appointments scheduled for today'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayAppts.map((appt) => (
              <div key={appt.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="text-xs font-mono text-slate-400 dark:text-slate-500 w-14 flex-shrink-0">
                  {new Date(appt.start_time).toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {appt.patient
                      ? `${(appt.patient as { first_name: string; last_name: string }).first_name} ${(appt.patient as { first_name: string; last_name: string }).last_name}`
                      : (appt.walk_in_name ?? 'Walk-in')}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {(appt.doctor as { full_name: string } | null)?.full_name ?? '—'}
                    {(appt.service as { name: string } | null)?.name ? ` · ${(appt.service as { name: string }).name}` : ''}
                  </p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  appt.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  appt.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {(appt.status ?? 'SCHEDULED').replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
