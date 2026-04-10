import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Users, CalendarDays, ReceiptText, Activity } from 'lucide-react';

export function DashboardPage() {
  const { i18n } = useTranslation();
  const { profile } = useAuthStore();
  const isRtl = i18n.language === 'ar';

  const stats = [
    {
      title: isRtl ? 'مواعيد اليوم' : "Today's Appointments",
      value: '12',
      icon: CalendarDays,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: isRtl ? 'إجمالي المرضى' : 'Total Patients',
      value: '1,248',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: isRtl ? 'إيرادات اليوم' : "Today's Revenue",
      value: isRtl ? '٤,٥٠٠ ج.م' : 'EGP 4,500',
      icon: ReceiptText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: isRtl ? 'معدل النشاط' : 'Activity Rate',
      value: '85%',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isRtl ? 'مرحباً،' : 'Welcome back,'} {profile?.full_name || (isRtl ? 'دكتور' : 'Doctor')} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isRtl
            ? 'إليك نظرة عامة على نشاط العيادة اليوم.'
            : "Here's an overview of your clinic's activity today."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder for Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Appointments Placeholder */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {isRtl ? 'المواعيد القادمة' : 'Upcoming Appointments'}
          </h2>
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 border-2 border-dashed border-slate-100 rounded-lg">
            <CalendarDays className="h-10 w-10 text-slate-300 mb-3" />
            <p>{isRtl ? 'لا توجد مواعيد قادمة مجدولة اليوم' : 'No upcoming appointments today.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}