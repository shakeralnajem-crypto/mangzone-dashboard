import { useState } from 'react';
import { ReceiptText, Plus, Search, CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useInvoices, useCreateInvoice, useRecordPayment } from '@/hooks/useInvoices';
import { usePatients } from '@/hooks/usePatients';
import { useDoctors } from '@/hooks/useStaff';
import { formatEGP } from '@/lib/currency';

const STATUS_STYLES: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  UNPAID: <AlertCircle className="h-3 w-3" />,
  PARTIALLY_PAID: <Clock className="h-3 w-3" />,
  PAID: <CheckCircle2 className="h-3 w-3" />,
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {STATUS_ICON[status]}
      {status.replace('_', ' ')}
    </span>
  );
}

interface PaymentModalProps {
  invoiceId: string;
  balanceDue: number;
  onClose: () => void;
}

function PaymentModal({ invoiceId, balanceDue, onClose }: PaymentModalProps) {
  const recordPayment = useRecordPayment();
  const [amount, setAmount] = useState(balanceDue.toString());
  const [method, setMethod] = useState('CASH');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await recordPayment.mutateAsync({
      invoice_id: invoiceId,
      clinic_id: '',  // will be filled by hook
      amount: parseFloat(amount),
      payment_method: method,
      payment_date: date,
      notes: null,
      collected_by: '',  // will be filled by hook
    } as never);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl space-y-4"
      >
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-brand-600" />
          Record Payment
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Balance due: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatEGP(balanceDue)}</span></p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Amount (EGP) *</label>
            <input
              required
              type="number"
              min="1"
              step="0.01"
              max={balanceDue}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Method *</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="VODAFONE_CASH">Vodafone Cash</option>
              <option value="INSTAPAY">InstaPay</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Date *</label>
            <input
              required
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={recordPayment.isPending}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {recordPayment.isPending ? 'Saving...' : 'Confirm Payment'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
        {recordPayment.isError && (
          <p className="text-sm text-red-600">{(recordPayment.error as Error).message}</p>
        )}
      </form>
    </div>
  );
}

export function BillingPage() {
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<{ id: string; balance: number } | null>(null);
  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    total_amount: '',
    notes: '',
    due_date: '',
  });

  const { data: invoices = [], isLoading, error } = useInvoices({ status: filterStatus || undefined });
  const { data: patients = [] } = usePatients('');
  const { data: doctors = [] } = useDoctors();
  const createInvoice = useCreateInvoice();

  const filtered = search.trim()
    ? invoices.filter((inv) => {
        const name = inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : '';
        return name.toLowerCase().includes(search.toLowerCase()) ||
          (inv.invoice_number ?? '').toLowerCase().includes(search.toLowerCase());
      })
    : invoices;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(form.total_amount);
    await createInvoice.mutateAsync({
      patient_id: form.patient_id || null,
      doctor_id: form.doctor_id || null,
      total_amount: total,
      balance_due: total,
      status: 'UNPAID',
      notes: form.notes || null,
      due_date: form.due_date || null,
    } as never);
    setForm({ patient_id: '', doctor_id: '', total_amount: '', notes: '', due_date: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{filtered.length} invoices</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      {/* New Invoice Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm"
        >
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">New Invoice</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Patient</label>
              <select
                value={form.patient_id}
                onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— Select patient —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Doctor</label>
              <select
                value={form.doctor_id}
                onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— Select doctor —</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Total Amount (EGP) *</label>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 1500"
                value={form.total_amount}
                onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <input
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 sm:col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createInvoice.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {createInvoice.isPending ? 'Saving...' : 'Create Invoice'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
          {createInvoice.isError && (
            <p className="text-sm text-red-600">{(createInvoice.error as Error).message}</p>
          )}
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search patient or invoice #..."
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
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">{(error as Error).message}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <ReceiptText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">No invoices found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Invoice #</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Patient</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Doctor</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Balance Due</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {inv.invoice_number || '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {inv.doctor?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">
                    {formatEGP(inv.total_amount)}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${inv.balance_due > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {formatEGP(inv.balance_due)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status ?? 'UNPAID'} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {(inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID') && (
                      <button
                        onClick={() => setPayingInvoice({ id: inv.id, balance: inv.balance_due ?? inv.total_amount })}
                        className="flex items-center gap-1 rounded-lg border border-brand-200 dark:border-brand-800 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                      >
                        <CreditCard className="h-3 w-3" />
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {payingInvoice && (
        <PaymentModal
          invoiceId={payingInvoice.id}
          balanceDue={payingInvoice.balance}
          onClose={() => setPayingInvoice(null)}
        />
      )}
    </div>
  );
}
