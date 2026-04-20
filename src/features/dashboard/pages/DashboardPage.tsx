import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTodayAppointments } from '@/hooks/useAppointments';
import { useOverdueLeads } from '@/hooks/useLeads';
import { useBillingStats } from '@/hooks/useInvoices';
import { formatEGP } from '@/lib/currency';
import { Users, CalendarDays, ReceiptText, TrendingUp, AlertCircle, Megaphone, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useT, getStatusLabel } from '@/lib/translations';

function initials(name: string) {
  return name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const STATUS_BADGE: Record<string, string> = {
  COMPLETED:   'ds-badge ds-badge-ok',
  CANCELLED:   'ds-badge ds-badge-err',
  IN_PROGRESS: 'ds-badge ds-badge-warn',
  NO_SHOW:     'ds-badge ds-badge-neutral',
  SCHEDULED:   'ds-badge ds-badge-p',
  ARRIVED:     'ds-badge ds-badge-a',
};

const GRADIENTS = [
  'linear-gradient(135deg,#6D28D9,#0891B2)',
  'linear-gradient(135deg,#0891B2,#059669)',
  'linear-gradient(135deg,#D97706,#DC2626)',
  'linear-gradient(135deg,#059669,#0891B2)',
  'linear-gradient(135deg,#7C3AED,#8B5CF6)',
];

const DAY_LABELS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_LABELS_AR = ['أحد','إثن','ثلا','أرب','خمس','جمع','سبت'];

export function DashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { canPage, canAction } = usePermissions();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const { data: stats, isLoading: sLoad } = useDashboardStats();
  const { data: rawAppts = [], isLoading: aLoad } = useTodayAppointments();

  const STATUS_ORDER: Record<string, number> = {
    SCHEDULED: 0, ARRIVED: 1, IN_PROGRESS: 2, COMPLETED: 3, NO_SHOW: 4, CANCELLED: 5,
  };
  const appts = [...rawAppts].sort((a, b) => {
    const timeDiff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    if (timeDiff !== 0) return timeDiff;
    return (STATUS_ORDER[a.status ?? 'SCHEDULED'] ?? 9) - (STATUS_ORDER[b.status ?? 'SCHEDULED'] ?? 9);
  });
  const { data: leads = [] } = useOverdueLeads();
  const { data: billing } = useBillingStats();

  const greeting = `${t.welcomeBack}, ${profile?.full_name ?? ''}`;

  // Weekly revenue bar heights from real data
  const weeklyRevenue = billing?.weeklyRevenue ?? [];
  const maxWeekly = Math.max(...weeklyRevenue, 1);
  const DAY_LABELS = isAr ? DAY_LABELS_AR : DAY_LABELS_EN;

  // Last 7 day labels (Sun-Sat order shifted to current week)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.getDay();
  });

  // ── Visibility flags ────────────────────────────────────────────────────────
  const showAppointments = canPage('/appointments');
  const showPatients     = canPage('/patients');
  const showLeads        = canPage('/leads');
  const showBilling      = canPage('/billing');
  const showFollowups    = canPage('/followup');

  // ── KPI cards ───────────────────────────────────────────────────────────────
  const allKpis = [
    {
      show: showPatients,
      color: 'ds-stat-p',
      iconBg: 'rgba(109,40,217,0.12)', iconClr: '#7C3AED', Icon: Users,
      label: t.totalPatients,
      val: stats?.totalPatients,
      sub: isAr ? 'مريض مسجل' : 'Registered',
      delay: '0.05s', path: '/patients',
    },
    {
      show: showAppointments,
      color: 'ds-stat-a',
      iconBg: 'rgba(8,145,178,0.12)', iconClr: '#0891B2', Icon: CalendarDays,
      label: t.todayAppts,
      val: stats?.todayAppointments,
      sub: isAr ? 'مجدول' : 'Scheduled',
      delay: '0.10s', path: '/appointments',
    },
    {
      show: showBilling,
      color: 'ds-stat-ok',
      iconBg: 'rgba(5,150,105,0.12)', iconClr: '#059669', Icon: TrendingUp,
      label: t.monthRevenue,
      val: stats ? formatEGP(stats.monthlyRevenue) : undefined,
      sub: isAr ? 'هذا الشهر' : 'This month',
      delay: '0.15s', path: '/accounting',
    },
    {
      show: showBilling,
      color: 'ds-stat-warn',
      iconBg: 'rgba(217,119,6,0.12)', iconClr: '#D97706', Icon: ReceiptText,
      label: t.unpaidInvoices,
      val: stats?.unpaidInvoices,
      sub: isAr ? 'معلقة' : 'Pending',
      delay: '0.20s', path: '/billing',
    },
    {
      show: showLeads,
      color: 'ds-stat-neutral',
      iconBg: 'rgba(109,40,217,0.08)', iconClr: '#7C3AED', Icon: Megaphone,
      label: t.newLeads,
      val: stats?.newLeads,
      sub: isAr ? 'جديد' : 'New',
      delay: '0.25s', path: '/leads',
    },
    {
      show: showAppointments,
      color: 'ds-stat-err',
      iconBg: 'rgba(220,38,38,0.12)', iconClr: '#DC2626', Icon: AlertCircle,
      label: t.cancelledToday,
      val: stats?.cancelledToday,
      sub: isAr ? 'ملغي' : 'Cancelled',
      delay: '0.30s', path: '/appointments',
    },
  ];
  const kpis = allKpis.filter(k => k.show);

  // ── Quick actions ────────────────────────────────────────────────────────────
  const allQuickActions = [
    { icon: '📅', label: t.newAppointment, path: '/appointments', action: 'create:appointment' as const },
    { icon: '👤', label: t.newPatient,     path: '/patients',     action: 'create:patient'     as const },
    { icon: '💬', label: t.newLead,        path: '/leads',        action: 'create:lead'        as const },
    { icon: '🧾', label: t.newInvoice,     path: '/billing',      action: 'create:invoice'     as const },
  ];
  const quickActions = allQuickActions.filter(qa => canAction(qa.action));

  // ── Grid column helper ───────────────────────────────────────────────────────
  const twoColIf = (left: boolean, right: boolean) =>
    left && right ? '1fr 1fr' : '1fr';

  return (
    <div className="ds-page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt)', marginBottom: 2 }}>{greeting}</h1>
        <p style={{ fontSize: 13, color: 'var(--txt3)' }}>
          {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid — auto-fill collapses on small screens */}
      {kpis.length > 0 && (
        <div className="stats-grid">
          {kpis.map(({ color, iconBg, iconClr, Icon, label, val, sub, delay, path }) => (
            <div
              key={label}
              className={`ds-stat ${color}`}
              style={{ animationDelay: delay, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onClick={() => navigate(path)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <p className="ds-stat-label">{label}</p>
                <div className="ds-stat-icon" style={{ background: iconBg }}>
                  <Icon style={{ width: 18, height: 18, color: iconClr }} />
                </div>
              </div>
              {sLoad ? (
                <div style={{ height: 32, width: 80, background: 'var(--brd)', borderRadius: 8, marginBottom: 4 }} className="animate-pulse" />
              ) : (
                <div className="ds-stat-value">{val ?? '—'}</div>
              )}
              <div style={{ fontSize: 11.5, color: 'var(--txt3)', fontWeight: 600 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pending payments alert */}
      {showBilling && billing && billing.pendingAmount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderRadius: 16, background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', cursor: 'pointer' }}
          onClick={() => navigate('/billing')}>
          <ReceiptText size={20} style={{ color: '#D97706', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>
              {isAr ? 'مبالغ معلقة: ' : 'Pending payments: '}
              <span style={{ color: '#D97706' }}>{formatEGP(billing.pendingAmount)}</span>
            </span>
            <span style={{ fontSize: 12, color: 'var(--txt3)', marginInlineStart: 8 }}>
              {stats?.unpaidInvoices ?? 0} {isAr ? 'فاتورة غير مدفوعة' : 'unpaid invoices'}
            </span>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--txt3)', flexShrink: 0 }} />
        </div>
      )}

      {/* Row: Schedule + Quick Actions */}
      {(showAppointments || quickActions.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: twoColIf(showAppointments, quickActions.length > 0), gap: 18, gridAutoRows: 'auto' }}
          className="dashboard-main-grid">

          {/* Today's Schedule */}
          {showAppointments && (
            <div className="ds-card">
              <div className="ds-card-hd">
                <span className="ds-card-title">{t.todaySchedule}</span>
                <span className="ds-badge ds-badge-p">{appts.length} {t.appts}</span>
              </div>
              {aLoad ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div className="ds-spinner" />
                </div>
              ) : appts.length === 0 ? (
                <div className="ds-empty">
                  <div className="ds-empty-icon"><CalendarDays size={22} /></div>
                  <p>{t.noAppointments}</p>
                </div>
              ) : (
                appts.map((appt, i) => {
                  const name = appt.patient
                    ? `${(appt.patient as { first_name: string; last_name: string }).first_name} ${(appt.patient as { first_name: string; last_name: string }).last_name}`
                    : appt.walk_in_name ?? 'Walk-in';
                  const doctor = (appt.doctor as { full_name: string } | null)?.full_name ?? '—';
                  const service = (appt.service as { name: string } | null)?.name ?? '';
                  const statusKey = appt.status ?? 'SCHEDULED';
                  return (
                    <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--brd)', transition: 'background 0.15s ease', cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--p-ultra)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--p2)', width: 48, textAlign: 'center', flexShrink: 0 }}>
                        {new Date(appt.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                      <div className="ds-avatar" style={{ width: 34, height: 34, fontSize: 12, background: GRADIENTS[i % GRADIENTS.length] }}>
                        {initials(name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--txt3)' }}>{service}</div>
                      </div>
                      <div style={{ background: 'var(--bg3)', color: 'var(--txt2)', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>{doctor}</div>
                      <span className={STATUS_BADGE[statusKey] ?? STATUS_BADGE['SCHEDULED']}>
                        {getStatusLabel(statusKey, isAr)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="ds-card">
              <div className="ds-card-hd">
                <span className="ds-card-title">{t.quickActions}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: quickActions.length === 1 ? '1fr' : '1fr 1fr', gap: 10, padding: 16 }}>
                {quickActions.map(qa => (
                  <button key={qa.path} onClick={() => navigate(qa.path)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 10px', borderRadius: 12, border: '1px solid var(--brd)', background: 'var(--bg3)', cursor: 'pointer', transition: 'all 0.2s ease', color: 'var(--txt2)', fontSize: 12, fontWeight: 700 }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--p2)'; el.style.color = 'var(--p2)'; el.style.background = 'var(--p-soft)'; el.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--brd)'; el.style.color = 'var(--txt2)'; el.style.background = 'var(--bg3)'; el.style.transform = ''; }}>
                    <span style={{ fontSize: 22 }}>{qa.icon}</span>
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row: Revenue chart + Follow-ups */}
      {(showBilling || showFollowups) && (
        <div style={{ display: 'grid', gridTemplateColumns: twoColIf(showBilling, showFollowups), gap: 18 }}>

          {/* Revenue mini chart */}
          {showBilling && (
            <div className="ds-card">
              <div className="ds-card-hd">
                <span className="ds-card-title">{t.revenueLast7}</span>
                <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--p2)' }}>
                  {billing ? formatEGP(billing.monthRevenue) : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80, padding: '14px 18px 0' }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const amt = weeklyRevenue[i] ?? 0;
                  const h = Math.max(8, Math.round((amt / maxWeekly) * 72));
                  const isToday = i === 6;
                  return (
                    <div key={i} title={formatEGP(amt)} style={{ flex: 1, height: h, borderRadius: '6px 6px 0 0', background: isToday ? 'linear-gradient(to bottom,#8B5CF6,#6D28D9)' : amt > 0 ? 'var(--p-soft)' : 'var(--bg3)', border: '1px solid var(--brd)', transition: 'all 0.3s', cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--p-glow)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isToday ? 'linear-gradient(to bottom,#8B5CF6,#6D28D9)' : amt > 0 ? 'var(--p-soft)' : 'var(--bg3)'; }} />
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 5, padding: '4px 18px 12px' }}>
                {last7Days.map((dayIdx, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: i === 6 ? 'var(--p2)' : 'var(--txt3)', fontWeight: i === 6 ? 800 : 500 }}>{DAY_LABELS[dayIdx]}</div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-ups */}
          {showFollowups && (
            <div className="ds-card">
              <div className="ds-card-hd">
                <span className="ds-card-title">{t.upcomingFollowups}</span>
                <button className="ds-btn ds-btn-ghost" style={{ padding: '5px 12px', fontSize: 11.5 }} onClick={() => navigate('/followup')}>
                  {t.viewAll}
                </button>
              </div>
              {leads.length === 0 ? (
                <div className="ds-empty" style={{ padding: '28px 20px' }}>
                  <p style={{ color: 'var(--txt3)', fontSize: 12.5 }}>{t.noFollowups}</p>
                </div>
              ) : leads.slice(0, 5).map(lead => (
                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--brd)', cursor: 'pointer', transition: 'background 0.15s ease' }}
                  onClick={() => navigate('/leads')}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--p-ultra)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--p2)', boxShadow: '0 0 6px var(--p-glow)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
                      {lead.service_interest ?? '—'}
                      {lead.follow_up_date ? ` · ${new Date(lead.follow_up_date).toLocaleDateString('en-EG')}` : ''}
                    </div>
                  </div>
                  <a href={`https://wa.me/${(lead.phone ?? '').replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20, flexShrink: 0, textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,211,102,0.25)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,211,102,0.12)'; }}>
                    WhatsApp
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
