import { useState } from 'react';
import { ReceiptText, Download, Plus, X, TrendingUp, Clock, AlertTriangle, FileText } from 'lucide-react';
import { useInvoices, useBillingStats, useCreateInvoice } from '@/hooks/useInvoices';
import { usePatients } from '@/hooks/usePatients';
import { formatEGP } from '@/lib/currency';
import { exportToCsv } from '@/lib/exportCsv';
import type { Database } from '@/types/supabase';

type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];

const INV_STATUS_COLORS: Record<string, string> = {
  PAID:           'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UNPAID:         'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DRAFT:          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  CANCELLED:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ─── Add Invoice Modal ────────────────────────────────────────────────────────

function AddInvoiceModal({ invoiceCount, onClose }: { invoiceCount: number; onClose: () => void }) {
  const { data: patients = [] } = usePatients('');
  const create = useCreateInvoice();

  const nextNumber = `INV-${String(invoiceCount + 1).padStart(3, '0')}`;

  const [form, setForm] = useState({
    patient_id: '',
    invoice_number: nextNumber,
    subtotal: '',
    discount: '0',
    total_amount: '',
    balance_due: '',
    status: 'UNPAID' as NonNullable<InvoiceInsert['status']>,
    due_date: '',
    notes: '',
  });
  const [submitError, setSubmitError] = useState('');

  const subtotalNum = parseFloat(form.subtotal) || 0;
  const discountNum = parseFloat(form.discount) || 0;
  const autoTotal = subtotalNum - discountNum;

  const handleSubtotalChange = (v: string) => {
    const sub = parseFloat(v) || 0;
    const disc = parseFloat(form.discount) || 0;
    const total = sub - disc;
    setForm(f => ({ ...f, subtotal: v, total_amount: total > 0 ? String(total) : '0', balance_due: total > 0 ? String(total) : '0' }));
  };
  const handleDiscountChange = (v: string) => {
    const sub = parseFloat(form.subtotal) || 0;
    const disc = parseFloat(v) || 0;
    const total = sub - disc;
    setForm(f => ({ ...f, discount: v, total_amount: total > 0 ? String(total) : '0', balance_due: total > 0 ? String(total) : '0' }));
  };
  const handleTotalChange = (v: string) => {
    setForm(f => ({ ...f, total_amount: v, balance_due: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const total = parseFloat(form.total_amount);
    const balance = parseFloat(form.balance_due);
    if (isNaN(total) || total <= 0) { setSubmitError('Total amount must be greater than 0.'); return; }
    try {
      await create.mutateAsync({
        patient_id: form.patient_id || null,
        invoice_number: form.invoice_number,
        subtotal: subtotalNum || null,
        discount: discountNum || null,
        total_amount: total,
        balance_due: isNaN(balance) ? total : balance,
        status: form.status,
        due_date: form.due_date || null,
        notes: form.notes || null,
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create invoice.');
    }
  };

  const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">New Invoice</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Patient</label>
              <select value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} className={field}>
                <option value="">— No patient —</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Invoice #</label>
              <input value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof form.status }))} className={field}>
                {(['DRAFT','UNPAID','PARTIALLY_PAID','PAID','CANCELLED'] as const).map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Subtotal (EGP)</label>
              <input type="number" min="0" step="0.01" value={form.subtotal} onChange={e => handleSubtotalChange(e.target.value)} placeholder="0" className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Discount (EGP)</label>
              <input type="number" min="0" step="0.01" value={form.discount} onChange={e => handleDiscountChange(e.target.value)} className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total *
                {autoTotal > 0 && <span className="ml-1 text-brand-500 font-normal normal-case">(auto: {autoTotal})</span>}
              </label>
              <input required type="number" min="0.01" step="0.01" value={form.total_amount} onChange={e => handleTotalChange(e.target.value)} className={field} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Balance Due (EGP)</label>
              <input type="number" min="0" step="0.01" value={form.balance_due} onChange={e => setForm(f => ({ ...f, balance_due: e.target.value }))} className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={field} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${field} resize-none`} />
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{submitError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={create.isPending}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
              {create.isPending ? 'Saving...' : 'Create Invoice'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function BillingPage() {
  const [addOpen, setAddOpen] = useState(false);
  const { data: invoices = [], isLoading, error } = useInvoices();
  const { data: stats } = useBillingStats();
  const errorMessage = error instanceof Error ? error.message : 'Failed to load invoices.';

  const handleExport = () => {
    exportToCsv('invoices', invoices.map(inv => ({
      'Invoice #': inv.invoice_number ?? '',
      Patient: inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : '',
      'Total (EGP)': inv.total_amount,
      'Balance Due (EGP)': inv.balance_due,
      Status: inv.status ?? '',
      'Due Date': inv.due_date ?? '',
      'Created At': inv.created_at,
    })));
  };

  const statCards = [
    {
      label: "Today's Revenue",
      value: formatEGP(stats?.todayRevenue ?? 0),
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    },
    {
      label: "This Month's Revenue",
      value: formatEGP(stats?.monthRevenue ?? 0),
      icon: Clock,
      color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    },
    {
      label: 'Pending Amount',
      value: formatEGP(stats?.pendingAmount ?? 0),
      icon: AlertTriangle,
      color: 'bg-gradient-to-br from-amber-400 to-orange-500',
    },
    {
      label: 'Total Invoices',
      value: stats?.totalInvoices ?? '—',
      icon: FileText,
      color: 'bg-gradient-to-br from-blue-400 to-cyan-500',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing</h1>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {invoices.length} total
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review invoice records, patient billing totals, and payment status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" /> Add Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map(card => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${card.color}`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice table */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <ReceiptText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-base font-medium text-slate-700 dark:text-slate-200">No invoices found.</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Click "Add Invoice" to create the first one.</p>
          <button onClick={() => setAddOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Invoice
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Invoice</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Patient</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{inv.invoice_number || '—'}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(inv.created_at).toLocaleDateString('en-EG', { dateStyle: 'medium' })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {inv.patient ? (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {inv.patient.first_name.charAt(0)}{inv.patient.last_name.charAt(0)}
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {inv.patient.first_name} {inv.patient.last_name}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{formatEGP(inv.total_amount)}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Balance: {formatEGP(inv.balance_due)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${INV_STATUS_COLORS[inv.status ?? 'UNPAID'] ?? ''}`}>
                      {(inv.status ?? 'UNPAID').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-EG', { dateStyle: 'medium' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && (
        <AddInvoiceModal invoiceCount={invoices.length} onClose={() => setAddOpen(false)} />
      )}
    </div>
  );
}
