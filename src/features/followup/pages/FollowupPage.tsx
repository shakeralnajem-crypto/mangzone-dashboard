import { useState } from 'react';
import { PhoneCall, Clock, AlertTriangle, CheckCircle2, Download, RefreshCw, MessageCircle, Edit2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFollowups, useFollowupStats, useAutoGenerateFollowups, useUpdateFollowupStatus, useUpdateFollowup } from '@/hooks/useFollowups';
import { exportToCsv } from '@/lib/exportCsv';
import { useT, getStatusLabel } from '@/lib/translations';
import { useHistoryStore } from '@/store/historyStore';
import type { FollowupLead } from '@/hooks/useFollowups';

type TabFilter = 'all' | 'pending' | 'overdue' | 'done';

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST'] as const;

const STATUS_CLS: Record<string, string> = {
  NEW:        'ds-badge ds-badge-neutral',
  CONTACTED:  'ds-badge ds-badge-a',
  INTERESTED: 'ds-badge ds-badge-warn',
  CONVERTED:  'ds-badge ds-badge-ok',
  LOST:       'ds-badge ds-badge-err',
};

function openWhatsApp(phone: string | null) {
  if (!phone) return;
  const cleaned = phone.replace(/\D/g, '');
  const intl = cleaned.startsWith('20') ? cleaned : `20${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
  window.open(`https://wa.me/${intl}`, '_blank', 'noopener,noreferrer');
}

// ─── Edit Follow-up Modal ─────────────────────────────────────────────────────

function EditFollowupModal({ followup, isAr, onClose }: { followup: FollowupLead; isAr: boolean; onClose: () => void }) {
  const t = useT(isAr);
  const update = useUpdateFollowup();
  const [form, setForm] = useState({
    name: followup.name,
    phone: followup.phone ?? '',
    service_interest: followup.service_interest ?? '',
    follow_up_date: followup.follow_up_date ?? '',
    notes: followup.notes ?? '',
    status: followup.status,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await update.mutateAsync({
        id: followup.id,
        name: form.name,
        phone: form.phone || null,
        service_interest: form.service_interest || null,
        follow_up_date: form.follow_up_date || null,
        notes: form.notes || null,
        status: form.status as FollowupLead['status'],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (isAr ? 'فشل الحفظ.' : 'Save failed.'));
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 480 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {isAr ? 'تعديل المتابعة' : 'Edit Follow-up'}
          </span>
          <button className="ds-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{t.name} *</label>
              <input required className="ds-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="ds-label">{t.phone}</label>
              <input type="tel" className="ds-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{isAr ? 'اهتمام الخدمة' : 'Service Interest'}</label>
              <input className="ds-input" value={form.service_interest} onChange={e => setForm(f => ({ ...f, service_interest: e.target.value }))} />
            </div>
            <div>
              <label className="ds-label">{t.followUpDate}</label>
              <input type="date" className="ds-input" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="ds-label">{t.status}</label>
            <select className="ds-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof form.status }))}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s, isAr)}</option>)}
            </select>
          </div>
          <div>
            <label className="ds-label">{t.notes}</label>
            <textarea className="ds-input" rows={2} style={{ resize: 'none' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          {error && <p className="ds-error">{error}</p>}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="submit" disabled={update.isPending} className="ds-btn ds-btn-primary" style={{ flex: 1 }}>
              {update.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : t.save}
            </button>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-ghost">{t.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function FollowupPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [editingFollowup, setEditingFollowup] = useState<FollowupLead | null>(null);

  const { data: followups = [], isLoading } = useFollowups();
  const { data: stats } = useFollowupStats();
  const autoGenerate = useAutoGenerateFollowups();
  const updateStatus = useUpdateFollowupStatus();
  const { pushAction } = useHistoryStore();

  const handleStatusChange = (id: string, oldStatus: string, newStatus: string) => {
    updateStatus.mutate({ id, status: newStatus });
    pushAction({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: `Changed follow-up status to ${newStatus}`,
      description_ar: `تغيير حالة المتابعة إلى ${newStatus}`,
      undo: async () => { await updateStatus.mutateAsync({ id, status: oldStatus }); },
      redo: async () => { await updateStatus.mutateAsync({ id, status: newStatus }); },
    });
  };

  const filtered: FollowupLead[] = activeTab === 'all'
    ? followups
    : followups.filter(f => f.category === activeTab);

  const handleAutoGenerate = async () => {
    const count = await autoGenerate.mutateAsync();
    if (count === 0) {
      alert(isAr
        ? 'لا توجد متابعات جديدة للإنشاء. جميع المواعيد المكتملة مسجلة.'
        : 'No new follow-ups to generate. All recent completed appointments already have leads.');
    } else {
      alert(isAr
        ? `تم إنشاء ${count} متابعة جديدة.`
        : `Generated ${count} new follow-up lead${count !== 1 ? 's' : ''}.`);
    }
  };

  const handleExport = () => {
    exportToCsv('followups', filtered.map(f => ({
      Name: f.name,
      Phone: f.phone ?? '',
      'Service Interest': f.service_interest ?? '',
      Status: f.status,
      'Follow-up Date': f.follow_up_date ?? '',
      Category: f.category,
    })));
  };

  const tabs: { id: TabFilter; labelKey: string; count: number }[] = [
    { id: 'all',     labelKey: t.allFollowups, count: followups.length },
    { id: 'pending', labelKey: t.pending,      count: followups.filter(f => f.category === 'pending').length },
    { id: 'overdue', labelKey: t.overdue,      count: followups.filter(f => f.category === 'overdue').length },
    { id: 'done',    labelKey: t.done,         count: followups.filter(f => f.category === 'done').length },
  ];

  const statItems = [
    { Icon: PhoneCall,     label: t.totalFollowups, value: stats?.total    ?? 0, cls: 'ds-stat-p' },
    { Icon: Clock,         label: isAr ? 'مستحق اليوم' : 'Due Today', value: stats?.dueToday ?? 0, cls: 'ds-stat-a' },
    { Icon: AlertTriangle, label: t.overdueCount,   value: stats?.overdue  ?? 0, cls: 'ds-stat-err' },
    { Icon: CheckCircle2,  label: t.doneCount,      value: stats?.done     ?? 0, cls: 'ds-stat-ok' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>

      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span className="ds-badge ds-badge-p" style={{ fontSize: 12, padding: '4px 10px' }}>
            {followups.length} {isAr ? 'متابعة' : 'follow-ups'}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={handleExport} className="ds-btn ds-btn-ghost" style={{ gap: 6 }}>
            <Download size={14} /> {isAr ? 'تصدير CSV' : 'Export CSV'}
          </button>
          <button onClick={handleAutoGenerate} disabled={autoGenerate.isPending} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <RefreshCw size={14} style={{ animation: autoGenerate.isPending ? 'spin 1s linear infinite' : 'none' }} />
            {isAr ? 'توليد تلقائي' : 'Auto-Generate'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {statItems.map(item => (
          <div key={item.label} className={`ds-stat ${item.cls}`}>
            <div className="ds-stat-icon"><item.Icon size={18} /></div>
            <div>
              <div className="ds-stat-label">{item.label}</div>
              <div className="ds-stat-value">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Table */}
      <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="ds-tabs" style={{ padding: '0 8px', borderBottom: '1px solid var(--brd)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ds-tab${activeTab === tab.id ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {tab.labelKey}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                background: activeTab === tab.id ? 'var(--p-soft)' : 'var(--bg3)',
                color: activeTab === tab.id ? 'var(--p2)' : 'var(--txt3)',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
            <div className="ds-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <PhoneCall size={36} style={{ color: 'var(--txt3)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>
              {isAr ? 'لا توجد متابعات في هذه الفئة.' : 'No follow-ups in this category.'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--txt3)' }}>
              {isAr
                ? 'استخدم "توليد تلقائي" لإنشاء متابعات من المواعيد المكتملة.'
                : 'Use "Auto-Generate" to create follow-ups from recent completed appointments.'}
            </p>
          </div>
        ) : (
          <table className="ds-table">
            <thead>
              <tr>
                <th className="ds-th">{t.name}</th>
                <th className="ds-th">{t.phone}</th>
                <th className="ds-th">{t.service}</th>
                <th className="ds-th">{t.followUpDate}</th>
                <th className="ds-th">{t.status}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} className="ds-tbody-row">
                  <td className="ds-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {f.category === 'overdue' && (
                        <AlertTriangle size={13} style={{ color: 'var(--err)', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{f.name}</span>
                    </div>
                  </td>
                  <td className="ds-td" style={{ fontSize: 13, color: 'var(--txt2)' }}>{f.phone ?? '—'}</td>
                  <td className="ds-td" style={{ fontSize: 13, color: 'var(--txt2)' }}>{f.service_interest ?? '—'}</td>
                  <td className="ds-td" style={{ fontSize: 12 }}>
                    {f.follow_up_date ? (
                      <span style={{
                        fontWeight: f.category === 'overdue' ? 700 : 400,
                        color: f.category === 'overdue' ? 'var(--err)'
                          : f.category === 'pending' ? 'var(--txt)'
                          : 'var(--txt3)',
                      }}>
                        {new Date(f.follow_up_date).toLocaleDateString('en-EG', { dateStyle: 'medium' })}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="ds-td">
                    <select
                      value={f.status}
                      onChange={e => handleStatusChange(f.id, f.status, e.target.value)}
                      className={STATUS_CLS[f.status] ?? 'ds-badge ds-badge-neutral'}
                      style={{ border: 'none', cursor: 'pointer', outline: 'none', background: 'transparent' }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{getStatusLabel(s, isAr)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="ds-td">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <button
                        onClick={() => setEditingFollowup(f)}
                        className="ds-icon-btn"
                        title={t.edit}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => openWhatsApp(f.phone)}
                        disabled={!f.phone}
                        title="WhatsApp"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: 'rgba(37,211,102,0.12)', color: '#25D366', border: 'none',
                          borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700,
                          cursor: f.phone ? 'pointer' : 'not-allowed', opacity: f.phone ? 1 : 0.4,
                        }}
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingFollowup && (
        <EditFollowupModal
          followup={editingFollowup}
          isAr={isAr}
          onClose={() => setEditingFollowup(null)}
        />
      )}
    </div>
  );
}
