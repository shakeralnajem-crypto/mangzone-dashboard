import { useState } from 'react';
import { PhoneCall, Clock, AlertTriangle, CheckCircle2, Download, RefreshCw, MessageCircle } from 'lucide-react';
import { useFollowups, useFollowupStats, useAutoGenerateFollowups, useUpdateFollowupStatus } from '@/hooks/useFollowups';
import { exportToCsv } from '@/lib/exportCsv';
import type { FollowupLead } from '@/hooks/useFollowups';

type TabFilter = 'all' | 'pending' | 'overdue' | 'done';

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST'] as const;

const STATUS_COLORS: Record<string, string> = {
  NEW:        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  CONTACTED:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  INTERESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CONVERTED:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LOST:       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function openWhatsApp(phone: string | null) {
  if (!phone) return;
  // Egyptian numbers: strip leading 0 and prepend country code 20
  const cleaned = phone.replace(/\D/g, '');
  const intl = cleaned.startsWith('20') ? cleaned : `20${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
  window.open(`https://wa.me/${intl}`, '_blank', 'noopener,noreferrer');
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bg: string;
}

function StatCard({ icon: Icon, label, value, color, bg }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export function FollowupPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const { data: followups = [], isLoading } = useFollowups();
  const { data: stats } = useFollowupStats();
  const autoGenerate = useAutoGenerateFollowups();
  const updateStatus = useUpdateFollowupStatus();

  const filtered: FollowupLead[] = activeTab === 'all'
    ? followups
    : followups.filter(f => f.category === activeTab);

  const handleAutoGenerate = async () => {
    const count = await autoGenerate.mutateAsync();
    if (count === 0) alert('No new follow-ups to generate. All recent completed appointments already have leads.');
    else alert(`Generated ${count} new follow-up lead${count !== 1 ? 's' : ''}.`);
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

  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: 'all',     label: 'All',     count: followups.length },
    { id: 'pending', label: 'Pending', count: followups.filter(f => f.category === 'pending').length },
    { id: 'overdue', label: 'Overdue', count: followups.filter(f => f.category === 'overdue').length },
    { id: 'done',    label: 'Done',    count: followups.filter(f => f.category === 'done').length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Follow-ups</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track and manage patient & lead follow-ups.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={handleAutoGenerate}
              disabled={autoGenerate.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              <RefreshCw className={`h-4 w-4 ${autoGenerate.isPending ? 'animate-spin' : ''}`} />
              Auto-Generate
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={PhoneCall}      label="Total Follow-ups" value={stats?.total    ?? 0} color="text-brand-600 dark:text-brand-400"  bg="bg-brand-50 dark:bg-brand-900/20" />
        <StatCard icon={Clock}          label="Due Today"        value={stats?.dueToday ?? 0} color="text-blue-600 dark:text-blue-400"    bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard icon={AlertTriangle}  label="Overdue"          value={stats?.overdue  ?? 0} color="text-red-600 dark:text-red-400"      bg="bg-red-50 dark:bg-red-900/20" />
        <StatCard icon={CheckCircle2}   label="Completed"        value={stats?.done     ?? 0} color="text-green-600 dark:text-green-400"  bg="bg-green-50 dark:bg-green-900/20" />
      </div>

      {/* Tabs + Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 px-4 dark:border-slate-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                activeTab === tab.id
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <PhoneCall className="mx-auto mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
            <p className="text-base font-medium text-slate-700 dark:text-slate-200">No follow-ups in this category.</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Use "Auto-Generate" to create follow-ups from recent completed appointments.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Service</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Follow-up Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(f => (
                <tr key={f.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {f.category === 'overdue' && (
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                      )}
                      <span className="font-medium text-slate-900 dark:text-slate-100">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{f.phone ?? '—'}</td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{f.service_interest ?? '—'}</td>
                  <td className="px-6 py-3">
                    {f.follow_up_date ? (
                      <span className={`text-sm font-medium ${
                        f.category === 'overdue'
                          ? 'text-red-600 dark:text-red-400'
                          : f.category === 'pending'
                          ? 'text-slate-700 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {new Date(f.follow_up_date).toLocaleDateString('en-EG', { dateStyle: 'medium' })}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={f.status}
                      onChange={e => updateStatus.mutate({ id: f.id, status: e.target.value })}
                      className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold outline-none cursor-pointer ${STATUS_COLORS[f.status] ?? ''}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openWhatsApp(f.phone)}
                        disabled={!f.phone}
                        title="Open WhatsApp"
                        className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-40 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
