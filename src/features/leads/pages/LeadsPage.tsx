import { useState } from 'react';
import { Megaphone, Search, Plus, X, Edit2, UserCheck, Trash2, Phone, Download, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLeads, useOverdueLeads, useCreateLead, useUpdateLead, useDeleteLead, useConvertLead } from '@/hooks/useLeads';
import { exportToCsv } from '@/lib/exportCsv';
import { useT, getStatusLabel } from '@/lib/translations';
import { useHistoryStore } from '@/store/historyStore';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/types/supabase';
import { BRAND } from '@/config/brand';

type Lead = Database['public']['Tables']['leads']['Row'];

const STATUS_CLS: Record<string, string> = {
  NEW:        'ds-badge ds-badge-p',
  CONTACTED:  'ds-badge ds-badge-warn',
  INTERESTED: 'ds-badge ds-badge-a',
  CONVERTED:  'ds-badge ds-badge-ok',
  LOST:       'ds-badge ds-badge-err',
};

const STATUS_TABS = ['ALL', 'NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST'] as const;
const SOURCES = ['Facebook', 'Instagram', 'WhatsApp', 'Walk-in', 'Referral', 'Other'];

const emptyForm = {
  name: '',
  phone: '',
  service_interest: '',
  source: '',
  campaign: '',
  status: 'NEW' as Lead['status'],
  notes: '',
  follow_up_date: '',
};

function isOverdue(lead: Lead): boolean {
  if (!lead.follow_up_date) return false;
  if (lead.status === 'CONVERTED' || lead.status === 'LOST') return false;
  return lead.follow_up_date <= new Date().toISOString().slice(0, 10);
}

// ─── Lead Modal ───────────────────────────────────────────────────────────────

function LeadModal({ lead, isAr, onClose }: { lead: Lead | null; isAr: boolean; onClose: () => void }) {
  const t = useT(isAr);
  const [form, setForm] = useState(
    lead
      ? {
          name: lead.name,
          phone: lead.phone ?? '',
          service_interest: lead.service_interest ?? '',
          source: lead.source ?? '',
          campaign: lead.campaign ?? '',
          status: lead.status,
          notes: lead.notes ?? '',
          follow_up_date: lead.follow_up_date ?? '',
        }
      : { ...emptyForm }
  );

  const create = useCreateLead();
  const update = useUpdateLead();
  const isPending = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      phone: form.phone || null,
      service_interest: form.service_interest || null,
      source: form.source || null,
      campaign: form.campaign || null,
      status: form.status,
      notes: form.notes || null,
      follow_up_date: form.follow_up_date || null,
    };
    if (lead) {
      await update.mutateAsync({ id: lead.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 520 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {lead ? t.editLead : t.addLead}
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
              <input className="ds-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="ds-label">{t.interestedIn}</label>
              <input className="ds-input" value={form.service_interest} onChange={e => setForm(f => ({ ...f, service_interest: e.target.value }))} placeholder={isAr ? 'مثال: تقويم، زراعة...' : 'e.g. Braces, Implant...'} />
            </div>
            <div>
              <label className="ds-label">{t.source}</label>
              <select className="ds-input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                <option value="">{isAr ? '— اختر المصدر —' : '— Select source —'}</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="ds-label">{isAr ? 'الحملة' : 'Campaign'}</label>
              <input className="ds-input" value={form.campaign} onChange={e => setForm(f => ({ ...f, campaign: e.target.value }))} placeholder={isAr ? 'مثال: عرض الصيف...' : 'e.g. Summer Promo...'} />
            </div>
            <div>
              <label className="ds-label">{t.status}</label>
              <select className="ds-input" value={form.status ?? 'NEW'} onChange={e => setForm(f => ({ ...f, status: e.target.value as Lead['status'] }))}>
                {['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST'].map(s => (
                  <option key={s} value={s}>{getStatusLabel(s, isAr)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ds-label">{t.followUpDate}</label>
              <input type="date" className="ds-input" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="ds-label">{t.notes}</label>
            <textarea className="ds-input" style={{ resize: 'none' }} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          {(create.isError || update.isError) && (
            <p className="ds-error">{((create.error || update.error) as Error)?.message}</p>
          )}

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="submit" disabled={isPending} className="ds-btn ds-btn-primary" style={{ flex: 1 }}>
              {isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : lead ? t.save : t.addLead}
            </button>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-ghost">{t.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LeadsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const clinicName = BRAND.name;

  const { data: leads = [], isLoading, error } = useLeads({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  });

  const { data: overdueLeads = [] } = useOverdueLeads();

  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();
  const updateLead = useUpdateLead();
  const { pushAction } = useHistoryStore();
  const { can } = usePermissions();

  const handleDelete = async (lead: Lead) => {
    if (!confirm(isAr ? 'حذف هذا العميل؟' : 'Delete this lead?')) return;
    await deleteLead.mutateAsync(lead.id);
    pushAction({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: `Deleted lead: ${lead.name}`,
      description_ar: `حُذف عميل: ${lead.name}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      undo: async () => { await updateLead.mutateAsync({ id: lead.id, deleted_at: null } as any); },
      redo: async () => { await deleteLead.mutateAsync(lead.id); },
    });
  };

  const handleConvert = async (lead: Lead) => {
    if (!confirm(`${isAr ? 'تحويل' : 'Convert'} "${lead.name}" ${isAr ? 'إلى مريض؟' : 'to a patient?'}`)) return;
    await convertLead.mutateAsync(lead);
  };

  const handleWhatsApp = (lead: Lead) => {
    const phone = (lead.phone ?? '').replace(/^0/, '2');
    const text = encodeURIComponent(
      isAr
        ? `السلام عليكم ${lead.name}، معاك فريق ${clinicName}. كنا تواصلنا معاك قبل كده بخصوص ${lead.service_interest ?? 'خدماتنا'}. كنا عايزين نتابع معاك ونشوف لو عندك أي استفسار. يسعدنا نساعدك 😊`
        : `Hello ${lead.name}, this is the ${clinicName} team. We reached out before regarding ${lead.service_interest ?? 'our services'}. We wanted to follow up and see if you have any questions. We'd love to help!`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleExport = () => {
    exportToCsv('leads', leads.map(l => ({
      Name: l.name,
      Phone: l.phone ?? '',
      'Service Interest': l.service_interest ?? '',
      Source: l.source ?? '',
      Campaign: l.campaign ?? '',
      Status: l.status,
      'Follow-up Date': l.follow_up_date ?? '',
      Notes: l.notes ?? '',
      'Created At': l.created_at,
    })));
  };

  const openAdd = () => { setEditingLead(null); setModalOpen(true); };
  const openEdit = (lead: Lead) => { setEditingLead(lead); setModalOpen(true); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease' }}>

      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span className="ds-badge ds-badge-p" style={{ fontSize: 12, padding: '4px 10px' }}>
            {leads.length} {isAr ? 'عميل' : 'leads'}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={handleExport} className="ds-btn ds-btn-ghost" style={{ gap: 6 }}>
            <Download size={14} /> {isAr ? 'تصدير CSV' : 'Export CSV'}
          </button>
          <button onClick={openAdd} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addLead}
          </button>
        </div>

        <div style={{ marginTop: 14, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', pointerEvents: 'none' }} />
          <input
            placeholder={isAr ? 'بحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ds-search"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Overdue Panel */}
      {overdueLeads.length > 0 && (
        <div style={{ borderRadius: 14, border: '1px solid var(--warn)', background: 'var(--warn-soft)', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertCircle size={15} style={{ color: 'var(--warn)', flexShrink: 0 }} />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--warn)', margin: 0 }}>
              {t.overdueFollowups} ({overdueLeads.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {overdueLeads.map(lead => (
              <div key={lead.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--brd)',
                padding: '10px 14px',
              }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{lead.name}</span>
                  {lead.service_interest && (
                    <span style={{ fontSize: 12, color: 'var(--txt3)', marginLeft: 8 }}>• {lead.service_interest}</span>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--err)', marginTop: 2 }}>
                    {isAr ? 'مستحق:' : 'Due:'} {lead.follow_up_date}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={STATUS_CLS[lead.status] ?? 'ds-badge ds-badge-neutral'}>
                    {getStatusLabel(lead.status, isAr)}
                  </span>
                  {lead.phone && (
                    <button
                      onClick={() => handleWhatsApp(lead)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: '#25D366', color: '#fff', border: 'none',
                        borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      <Phone size={11} /> WhatsApp
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="ds-tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`ds-tab${statusFilter === tab ? ' active' : ''}`}
          >
            {tab === 'ALL' ? t.allLeads : getStatusLabel(tab, isAr)}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="ds-card" style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : error ? (
        <div className="ds-card" style={{ padding: 18, background: 'var(--err-soft)', border: '1px solid var(--err)', color: 'var(--err)' }}>
          {(error as Error).message}
        </div>
      ) : leads.length === 0 ? (
        <div className="ds-empty">
          <Megaphone size={40} style={{ color: 'var(--txt3)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--txt3)' }}>{search ? t.noLeadsFound : t.noLeadsFound}</p>
        </div>
      ) : (
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="ds-th">{t.name}</th>
                <th className="ds-th">{t.phone}</th>
                <th className="ds-th mobile-hide">{t.service}</th>
                <th className="ds-th mobile-hide">{t.source}</th>
                <th className="ds-th mobile-hide">{isAr ? 'الحملة' : 'Campaign'}</th>
                <th className="ds-th">{t.status}</th>
                <th className="ds-th mobile-hide">{t.followUpDate}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="ds-tbody-row">
                  <td className="ds-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{lead.name}</td>
                  <td className="ds-td" style={{ fontSize: 13, color: 'var(--txt2)' }}>{lead.phone || '—'}</td>
                  <td className="ds-td mobile-hide" style={{ fontSize: 12, color: 'var(--txt3)' }}>{lead.service_interest || '—'}</td>
                  <td className="ds-td mobile-hide" style={{ fontSize: 12, color: 'var(--txt3)' }}>{lead.source || '—'}</td>
                  <td className="ds-td mobile-hide" style={{ fontSize: 12, color: 'var(--txt3)' }}>{lead.campaign || '—'}</td>
                  <td className="ds-td">
                    <span className={STATUS_CLS[lead.status] ?? 'ds-badge ds-badge-neutral'}>
                      {getStatusLabel(lead.status, isAr)}
                    </span>
                  </td>
                  <td className="ds-td mobile-hide" style={{ fontSize: 12 }}>
                    {lead.follow_up_date ? (
                      <span style={{ fontWeight: isOverdue(lead) ? 700 : 400, color: isOverdue(lead) ? 'var(--err)' : 'var(--txt3)' }}>
                        {lead.follow_up_date}{isOverdue(lead) ? ' !' : ''}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="ds-td">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      {lead.phone && (
                        <button
                          onClick={() => handleWhatsApp(lead)}
                          title="WhatsApp"
                          style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: 'none', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', display: 'flex' }}
                        >
                          <Phone size={13} />
                        </button>
                      )}
                      {(lead.status === 'INTERESTED' || lead.status === 'CONTACTED') && (
                        <button onClick={() => handleConvert(lead)} className="ds-icon-btn" title={t.convertToPatient}>
                          <UserCheck size={13} />
                        </button>
                      )}
                      <button onClick={() => openEdit(lead)} className="ds-icon-btn">
                        <Edit2 size={13} />
                      </button>
                      {can('delete:lead') && (
                        <button onClick={() => handleDelete(lead)} className="ds-icon-btn-err">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <LeadModal
          lead={editingLead}
          isAr={isAr}
          onClose={() => { setModalOpen(false); setEditingLead(null); }}
        />
      )}
    </div>
  );
}
