import { useState } from 'react';
import { Megaphone, Search, Plus, X, Edit2, UserCheck, Trash2, Phone, Download, AlertCircle } from 'lucide-react';
import { useLeads, useOverdueLeads, useCreateLead, useUpdateLead, useDeleteLead, useConvertLead } from '@/hooks/useLeads';
import { exportToCsv } from '@/lib/exportCsv';
import type { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CONTACTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  INTERESTED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CONVERTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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

interface LeadModalProps {
  lead: Lead | null;
  onClose: () => void;
}

function LeadModal({ lead, onClose }: LeadModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Phone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="01xxxxxxxxx"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Service Interest</label>
              <input
                value={form.service_interest}
                onChange={e => setForm(f => ({ ...f, service_interest: e.target.value }))}
                placeholder="e.g. Braces, Implant..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Source</label>
              <select
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— Select source —</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Campaign</label>
              <input
                value={form.campaign}
                onChange={e => setForm(f => ({ ...f, campaign: e.target.value }))}
                placeholder="e.g. Summer Promo, Meta Ads..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
              <select
                value={form.status ?? 'NEW'}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Lead['status'] }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              >
                {['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Follow-up Date</label>
              <input
                type="date"
                value={form.follow_up_date}
                onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {isPending ? 'Saving...' : lead ? 'Save Changes' : 'Add Lead'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
          </div>
          {(create.isError || update.isError) && (
            <p className="text-sm text-red-600">{((create.error || update.error) as Error)?.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export function LeadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const clinicName = 'MangZone';

  const { data: leads = [], isLoading, error } = useLeads({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  });

  const { data: overdueLeads = [] } = useOverdueLeads();

  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await deleteLead.mutateAsync(id);
  };

  const handleConvert = async (lead: Lead) => {
    if (!confirm(`Convert "${lead.name}" to a patient?`)) return;
    await convertLead.mutateAsync(lead);
  };

  const handleWhatsApp = (lead: Lead) => {
    const phone = (lead.phone ?? '').replace(/^0/, '2');
    const text = encodeURIComponent(
      `السلام عليكم ${lead.name}، معاك فريق ${clinicName}. كنا تواصلنا معاك قبل كده بخصوص ${lead.service_interest ?? 'خدماتنا'}. كنا عايزين نتابع معاك ونشوف لو عندك أي استفسار. يسعدنا نساعدك 😊`
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

  const openAdd = () => {
    setEditingLead(null);
    setModalOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Leads / CRM</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{leads.length} leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Overdue Follow-ups Panel */}
      {overdueLeads.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Overdue Follow-ups ({overdueLeads.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overdueLeads.map(lead => (
              <div key={lead.id} className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-800/40 px-3 py-2">
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{lead.name}</span>
                  {lead.service_interest && (
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">• {lead.service_interest}</span>
                  )}
                  <div className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                    Due: {lead.follow_up_date}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[lead.status] ?? ''}`}>
                    {lead.status}
                  </span>
                  {lead.phone && (
                    <button
                      onClick={() => handleWhatsApp(lead)}
                      className="flex items-center gap-1 rounded-lg bg-green-500 hover:bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors"
                    >
                      <Phone className="h-3 w-3" /> WhatsApp
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === tab
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {(error as Error).message}
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">{search ? 'No leads found.' : 'No leads yet.'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Service</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Source</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Campaign</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Follow-up</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{lead.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{lead.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{lead.service_interest || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{lead.source || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{lead.campaign || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[lead.status] ?? ''}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {lead.follow_up_date ? (
                      <span className={isOverdue(lead) ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}>
                        {lead.follow_up_date}
                        {isOverdue(lead) && ' ⚠'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {lead.phone && (
                        <button
                          onClick={() => handleWhatsApp(lead)}
                          title="Send WhatsApp"
                          className="rounded p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {(lead.status === 'INTERESTED' || lead.status === 'CONTACTED') && (
                        <button
                          onClick={() => handleConvert(lead)}
                          title="Convert to Patient"
                          className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(lead)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <LeadModal
          lead={editingLead}
          onClose={() => { setModalOpen(false); setEditingLead(null); }}
        />
      )}
    </div>
  );
}
