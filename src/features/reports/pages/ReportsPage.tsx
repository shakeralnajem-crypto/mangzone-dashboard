import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useT } from '@/lib/translations';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatEGP } from '@/lib/currency';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const COLORS = [
  '#7C3AED',
  '#0891B2',
  '#059669',
  '#D97706',
  '#DC2626',
  '#8B5CF6',
];

function useReportsData() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  return useQuery({
    queryKey: ['reports-full', clinicId],
    enabled: !!clinicId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const now = new Date();
      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toISOString().slice(0, 7));
      }
      const [
        paymentsRes,
        appointmentsRes,
        patientsRes,
        invoicesRes,
        servicesRes,
        leadsRes,
      ] = await Promise.all([
        db
          .from('payments')
          .select('amount, payment_date')
          .eq('clinic_id', clinicId!)
          .is('deleted_at', null),
        db
          .from('appointments')
          .select('start_time, status, service_id')
          .eq('clinic_id', clinicId!)
          .is('deleted_at', null),
        db
          .from('patients')
          .select('created_at, gender')
          .eq('clinic_id', clinicId!)
          .is('deleted_at', null),
        db
          .from('invoices')
          .select('total_amount, balance_due, status, created_at')
          .eq('clinic_id', clinicId!)
          .is('deleted_at', null),
        db
          .from('services')
          .select('id, name')
          .eq('clinic_id', clinicId!)
          .eq('is_active', true),
        db
          .from('leads')
          .select('status, source')
          .eq('clinic_id', clinicId!)
          .is('deleted_at', null),
      ]);

      const payments = (paymentsRes.data ?? []) as {
        amount: number;
        payment_date: string;
      }[];
      const appointments = (appointmentsRes.data ?? []) as {
        start_time: string;
        status: string;
        service_id: string | null;
      }[];
      const patients = (patientsRes.data ?? []) as {
        created_at: string;
        gender: string | null;
      }[];
      const invoices = (invoicesRes.data ?? []) as {
        total_amount: number;
        balance_due: number;
        status: string | null;
        created_at: string;
      }[];
      const services = (servicesRes.data ?? []) as {
        id: string;
        name: string;
      }[];
      const leads = (leadsRes.data ?? []) as {
        status: string;
        source: string | null;
      }[];

      const revenueByMonth = months.map((month) => ({
        month: new Date(month + '-01').toLocaleString('en-EG', {
          month: 'short',
        }),
        revenue: payments
          .filter((p) => p.payment_date?.slice(0, 7) === month)
          .reduce((s, p) => s + (p.amount ?? 0), 0),
        invoiced: invoices
          .filter((i) => i.created_at?.slice(0, 7) === month)
          .reduce((s, i) => s + (i.total_amount ?? 0), 0),
      }));

      const statusCount: Record<string, number> = {};
      appointments.forEach((a) => {
        const s = a.status ?? 'UNKNOWN';
        statusCount[s] = (statusCount[s] ?? 0) + 1;
      });
      const apptByStatus = Object.entries(statusCount).map(([name, value]) => ({
        name,
        value,
      }));

      const patientsByMonth = months.map((month) => ({
        month: new Date(month + '-01').toLocaleString('en-EG', {
          month: 'short',
        }),
        new: patients.filter((p) => p.created_at?.slice(0, 7) === month).length,
      }));

      const serviceCount: Record<string, number> = {};
      appointments.forEach((a) => {
        if (a.service_id)
          serviceCount[a.service_id] = (serviceCount[a.service_id] ?? 0) + 1;
      });
      const topServices = Object.entries(serviceCount)
        .map(([id, count]) => ({
          name: services.find((s) => s.id === id)?.name ?? 'Unknown',
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const genderData = [
        {
          name: 'Male',
          value: patients.filter((p) => p.gender === 'MALE').length,
        },
        {
          name: 'Female',
          value: patients.filter((p) => p.gender === 'FEMALE').length,
        },
        {
          name: 'Other',
          value: patients.filter((p) => !p.gender || p.gender === 'OTHER')
            .length,
        },
      ].filter((g) => g.value > 0);

      const today = new Date().toISOString().slice(0, 10);
      const monthStart = today.slice(0, 7) + '-01';
      const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
      const monthRevenue = payments
        .filter((p) => p.payment_date >= monthStart)
        .reduce((s, p) => s + p.amount, 0);
      const pendingAmount = invoices
        .filter((i) => ['UNPAID', 'PARTIALLY_PAID'].includes(i.status ?? ''))
        .reduce((s, i) => s + i.balance_due, 0);
      const completedAppts = appointments.filter(
        (a) => a.status === 'COMPLETED'
      ).length;
      const completionRate =
        appointments.length > 0
          ? Math.round((completedAppts / appointments.length) * 100)
          : 0;
      const convertedLeads = leads.filter(
        (l) => l.status === 'CONVERTED'
      ).length;
      const conversionRate =
        leads.length > 0
          ? Math.round((convertedLeads / leads.length) * 100)
          : 0;

      const sourceCount: Record<string, number> = {};
      leads.forEach((l) => {
        const s = l.source ?? 'Unknown';
        sourceCount[s] = (sourceCount[s] ?? 0) + 1;
      });
      const leadSources = Object.entries(sourceCount).map(([name, value]) => ({
        name,
        value,
      }));

      return {
        revenueByMonth,
        apptByStatus,
        patientsByMonth,
        topServices,
        genderData,
        leadSources,
        kpis: {
          totalPatients: patients.length,
          totalRevenue,
          monthRevenue,
          pendingAmount,
          totalAppointments: appointments.length,
          completionRate,
          totalLeads: leads.length,
          conversionRate,
        },
      };
    },
  });
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div
      className="ds-card"
      style={{
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          flexShrink: 0,
          background: color + '18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 12,
            color: 'var(--txt3)',
            fontWeight: 500,
            marginBottom: 2,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--txt)',
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {sub && (
          <p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{ padding: '14px 18px', borderBottom: '1px solid var(--brd)' }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '20px 18px' }}>{children}</div>
    </div>
  );
}

const tooltipStyle = {
  background: 'var(--bg2)',
  border: '1px solid var(--brd)',
  borderRadius: 10,
  fontSize: 12,
};

export function ReportsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);
  const { data, isLoading, error } = useReportsData();

  const currentMonth = useMemo(
    () =>
      new Date().toLocaleString(isAr ? 'ar-EG' : 'en-EG', {
        month: 'long',
        year: 'numeric',
      }),
    [isAr]
  );

  if (isLoading)
    return (
      <div
        className="ds-card"
        style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}
      >
        <div className="ds-spinner" />
      </div>
    );

  if (error || !data)
    return (
      <div
        className="ds-card"
        style={{
          padding: 18,
          background: 'var(--err-soft)',
          border: '1px solid var(--err)',
          color: 'var(--err)',
        }}
      >
        {isAr ? 'فشل تحميل التقارير.' : 'Failed to load reports.'}
      </div>
    );

  const {
    kpis,
    revenueByMonth,
    apptByStatus,
    patientsByMonth,
    topServices,
    genderData,
    leadSources,
  } = data;

  const statusLabels: Record<string, string> = {
    COMPLETED: 'Completed',
    SCHEDULED: 'Scheduled',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
    ARRIVED: 'Arrived',
    IN_PROGRESS: 'In Progress',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <p style={{ fontSize: 12, color: 'var(--txt3)' }}>
        {isAr ? 'تقرير شامل ·' : 'Comprehensive analytics ·'} {currentMonth}
      </p>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 14,
        }}
      >
        <KpiCard
          label={t.totalPatients}
          value={String(kpis.totalPatients)}
          icon={Users}
          color="#7C3AED"
        />
        <KpiCard
          label={isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}
          value={formatEGP(kpis.totalRevenue)}
          icon={DollarSign}
          color="#059669"
          sub={`${isAr ? 'هذا الشهر:' : 'This month:'} ${formatEGP(kpis.monthRevenue)}`}
        />
        <KpiCard
          label={isAr ? 'مبالغ معلقة' : 'Pending Amount'}
          value={formatEGP(kpis.pendingAmount)}
          icon={AlertCircle}
          color="#D97706"
        />
        <KpiCard
          label={isAr ? 'إجمالي المواعيد' : 'Total Appointments'}
          value={String(kpis.totalAppointments)}
          icon={Calendar}
          color="#0891B2"
          sub={`${isAr ? 'نسبة الإكمال:' : 'Completion:'} ${kpis.completionRate}%`}
        />
        <KpiCard
          label={isAr ? 'العملاء المحتملون' : 'Total Leads'}
          value={String(kpis.totalLeads)}
          icon={UserCheck}
          color="#8B5CF6"
          sub={`${isAr ? 'نسبة التحويل:' : 'Conversion:'} ${kpis.conversionRate}%`}
        />
        <KpiCard
          label={isAr ? 'إيرادات الشهر' : 'Monthly Revenue'}
          value={formatEGP(kpis.monthRevenue)}
          icon={TrendingUp}
          color="#059669"
        />
      </div>

      {/* Revenue Area Chart */}
      <SectionCard
        title={
          isAr
            ? 'الإيرادات vs الفواتير — آخر 6 أشهر'
            : 'Revenue vs Invoiced — Last 6 Months'
        }
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={revenueByMonth}
            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gInvoiced" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0891B2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--brd)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: 'var(--txt3)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--txt3)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--txt2)' }} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Collected"
              stroke="#7C3AED"
              strokeWidth={2}
              fill="url(#gRevenue)"
            />
            <Area
              type="monotone"
              dataKey="invoiced"
              name="Invoiced"
              stroke="#0891B2"
              strokeWidth={2}
              fill="url(#gInvoiced)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Pie Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard
          title={isAr ? 'المواعيد حسب الحالة' : 'Appointments by Status'}
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={apptByStatus}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                nameKey="name"
                paddingAngle={3}
              >
                {apptByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [v, statusLabels[n as string] ?? n]}
                contentStyle={tooltipStyle}
              />
              <Legend
                formatter={(v) => statusLabels[v] ?? v}
                wrapperStyle={{ fontSize: 11, color: 'var(--txt2)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard
          title={isAr ? 'توزيع المرضى بالجنس' : 'Patient Gender Distribution'}
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                nameKey="name"
                paddingAngle={3}
              >
                {genderData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--txt2)' }} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* New Patients Bar Chart */}
      <SectionCard
        title={
          isAr ? 'المرضى الجدد — آخر 6 أشهر' : 'New Patients — Last 6 Months'
        }
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={patientsByMonth}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--brd)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: 'var(--txt3)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--txt3)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="new"
              name={isAr ? 'مرضى جدد' : 'New Patients'}
              fill="#7C3AED"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top Services */}
        <SectionCard title={isAr ? 'أكثر الخدمات طلباً' : 'Top Services'}>
          {topServices.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: 'var(--txt3)',
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              No data yet
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topServices.map((s, i) => (
                <div
                  key={s.name}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: COLORS[i % COLORS.length] + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: COLORS[i % COLORS.length],
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--txt)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.name}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--txt2)',
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        {s.count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: 'var(--bg3)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 4,
                          background: COLORS[i % COLORS.length],
                          width: `${Math.round((s.count / topServices[0].count) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Lead Sources */}
        <SectionCard title={isAr ? 'مصادر العملاء المحتملين' : 'Lead Sources'}>
          {leadSources.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: 'var(--txt3)',
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              No data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={leadSources}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--brd)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'var(--txt3)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--txt2)' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="value"
                  name="Leads"
                  fill="#0891B2"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
