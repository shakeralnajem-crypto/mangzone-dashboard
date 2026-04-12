import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useT } from '@/lib/translations';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatEGP } from '@/lib/currency';

export function ReportsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const { data: stats, isLoading, error } = useDashboardStats();
  const currentMonth = new Date().toLocaleString(isAr ? 'ar-EG' : 'en-EG', { month: 'long', year: 'numeric' });
  const errorMessage = error instanceof Error ? error.message : (isAr ? 'فشل تحميل التقارير.' : 'Failed to load reports.');

  const rows = stats
    ? [
        { label: t.totalPatients,    value: String(stats.totalPatients ?? 0),     cls: 'ds-stat-p' },
        { label: t.todayAppts,       value: String(stats.todayAppointments ?? 0), cls: 'ds-stat-a' },
        { label: t.unpaidInvoices,   value: String(stats.unpaidInvoices ?? 0),    cls: 'ds-stat-warn' },
        { label: t.newLeads,         value: String(stats.newLeads ?? 0),          cls: 'ds-stat-ok' },
        { label: t.cancelledToday,   value: String(stats.cancelledToday ?? 0),    cls: 'ds-stat-err' },
        { label: t.monthRevenue,     value: formatEGP(stats.monthlyRevenue),      cls: 'ds-stat-ok' },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>

      <div style={{ marginBottom: 4 }}>
        <p style={{ fontSize: 12, color: 'var(--txt3)' }}>
          {t.overviewFor} {currentMonth}
        </p>
      </div>

      {isLoading ? (
        <div className="ds-card" style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : error ? (
        <div className="ds-card" style={{ padding: 18, background: 'var(--err-soft)', border: '1px solid var(--err)', color: 'var(--err)' }}>
          {errorMessage}
        </div>
      ) : rows.length === 0 ? (
        <div className="ds-empty">
          <TrendingUp size={40} style={{ color: 'var(--txt3)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--txt3)' }}>{t.noData}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {rows.map(row => (
            <div key={row.label} className={`ds-stat ${row.cls}`}>
              <div className="ds-stat-icon"><TrendingUp size={18} /></div>
              <div>
                <div className="ds-stat-label">{row.label}</div>
                <div className="ds-stat-value">{row.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
