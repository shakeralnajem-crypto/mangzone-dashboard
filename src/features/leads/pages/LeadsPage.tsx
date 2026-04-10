import { useState } from 'react';
import { Megaphone, Plus, Search, UserPlus } from 'lucide-react';
import { useLeads, useCreateLead, useUpdateLeadStatus, useConvertLead } from '@/hooks/useLeads';
import type { Database } from '@/types/supabase';

type LeadStatus = Database['public']['Tables']['leads']['Row']['status'];

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CONTACTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  INTERESTED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CONVERTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST'];

const SOURCES = ['INSTAGRAM', 'FACEBOOK', 'GOOGLE', 'REFERRAL', 'WALK_IN', 'OTHER'];

export function LeadsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    service_interest: '',
    source: '',
    notes: '',
  });

  const { data: leads = [], isLoading, error } = useLeads({
    search: search || undefined,
    status: filterStatus || undefined,
  });
  const createLead = useCreateLead();
  const updateStatus = useUpdateLeadStatus();
  const convert = useConvertLead();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLead.mutateAsync({
      name: form.name,
      phone: form.phone || null,
      service_interest: form.service_interest || null,
      source: form.source || null,
      notes: form.notes || null,
      status: 'NEW',
      follow_up_date: null,
      converted_patient_id: null,
    } as never);
    setForm({ name: '', phone: '', service_interest: '', source: '', notes: '' });
    setShowForm(false);
  };

  const handleConvert = async (lead: typeof leads[0]) => {
    if (!confirm(`Convert "${lead.name}" to a patient?`)) return;
    await convert.mutateAsync(lead);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Leads / CRM</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{leads.length} leads</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Lead
        </button>
      </div>

      {/* Add Lead form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm"
        >
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">New Lead</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Full name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              placeholder="Service interest (e.g. Braces, Implant)"
              value={form.service_interest}
              onChange={e => setForm(f => ({ ...f, service_interest: e.target.value }))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— Source —</option>
              {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <input
              placeholder="Notes"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 sm:col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createLead.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {createLead.isPending ? 'Saving...' : 'Save Lead'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
          {createLead.isError && (
            <p className="text-sm text-red-600">{(createLead.error as Error).message}</p>
          )}
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">{(error as Error).message}</div>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">{search || filterStatus ? 'No leads found.' : 'No leads yet. Add your first lead.'}</p>
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
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{lead.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="hover:text-brand-600">{lead.phone}</a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{lead.service_interest ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">{lead.source ?? '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status ?? 'NEW'}
                      onChange={e => updateStatus.mutate({ id: lead.id, status: e.target.value as LeadStatus })}
                      disabled={lead.status === 'CONVERTED'}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border-0 outline-none cursor-pointer ${STATUS_STYLES[lead.status ?? 'NEW']} disabled:cursor-default`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
                      <button
                        onClick={() => handleConvert(lead)}
                        disabled={convert.isPending}
                        className="flex items-center gap-1 rounded-lg border border-green-200 dark:border-green-800 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                        title="Convert to patient"
                      >
                        <UserPlus className="h-3 w-3" />
                        Convert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
