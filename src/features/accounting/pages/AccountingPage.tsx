import { useState } from 'react';
import { Calculator, Plus, Trash2, Download, X, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import {
  useExpenses,
  useCreateExpense,
  useDeleteExpense,
  useDoctorDues,
  useMonthlyReport,
} from '@/hooks/useAccounting';
import { exportToCsv } from '@/lib/exportCsv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EXPENSE_CATEGORIES = ['Rent', 'Salaries', 'Supplies', 'Equipment', 'Marketing', 'Utilities', 'Other'];

type Tab = 'expenses' | 'doctor-dues' | 'monthly-report';

const emptyExpenseForm = {
  category: 'Supplies',
  description: '',
  amount: '',
  expense_date: new Date().toISOString().slice(0, 10),
  paid_to: '',
  notes: '',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n);
}

// ─── Expenses Tab ────────────────────────────────────────────────────────────

function ExpensesTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyExpenseForm });

  const { data: expenses = [], isLoading } = useExpenses(year, month);
  const create = useCreateExpense();
  const remove = useDeleteExpense();

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      category: form.category,
      description: form.description || null,
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
      paid_to: form.paid_to || null,
      notes: form.notes || null,
    });
    setForm({ ...emptyExpenseForm });
    setShowForm(false);
  };

  const handleExport = () => {
    exportToCsv(`expenses_${year}_${String(month).padStart(2, '0')}`, expenses.map(e => ({
      Category: e.category,
      Description: e.description ?? '',
      'Amount (EGP)': e.amount,
      Date: e.expense_date,
      'Paid To': e.paid_to ?? '',
      Notes: e.notes ?? '',
    })));
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
          >
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Total: {fmt(total)}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">New Expense</h3>
            <button type="button" onClick={() => setShowForm(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Category *</label>
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Amount (EGP) *</label>
              <input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Date *</label>
              <input required type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Paid To</label>
              <input value={form.paid_to} onChange={e => setForm(f => ({ ...f, paid_to: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={create.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {create.isPending ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>
      ) : expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <p className="text-sm text-slate-400">No expenses recorded for this month.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Paid To</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{exp.description || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{exp.expense_date}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{exp.paid_to || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">{fmt(exp.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove.mutate(exp.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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

// ─── Doctor Dues Tab ─────────────────────────────────────────────────────────

function DoctorDuesTab() {
  const [clinicPercent, setClinicPercent] = useState(30);
  const { data: dues = [], isLoading } = useDoctorDues(clinicPercent);

  const handleExport = () => {
    exportToCsv('doctor_dues', dues.map(d => ({
      Doctor: d.doctorName,
      'Total Billed (EGP)': d.totalBilled,
      'Clinic Share (EGP)': d.clinicShare,
      'Doctor Due (EGP)': d.doctorDue,
      'Invoice Count': d.invoiceCount,
    })));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Clinic Share %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={clinicPercent}
            onChange={e => setClinicPercent(Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="text-xs text-slate-400">Doctor gets {100 - clinicPercent}%</span>
        </div>
        <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>
      ) : dues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <p className="text-sm text-slate-400">No paid invoices with assigned doctors found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Doctor</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Invoices</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Billed</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Clinic ({clinicPercent}%)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Doctor Due ({100 - clinicPercent}%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dues.map(d => (
                <tr key={d.doctorId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{d.doctorName}</td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{d.invoiceCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">{fmt(d.totalBilled)}</td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{fmt(d.clinicShare)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{fmt(d.doctorDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Monthly Report Tab ───────────────────────────────────────────────────────

function MonthlyReportTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data: report, isLoading } = useMonthlyReport(year, month);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const handleExport = () => {
    if (!report) return;
    exportToCsv(`monthly_report_${year}_${String(month).padStart(2, '0')}`, [
      { Metric: 'Revenue', Value: report.revenue },
      { Metric: 'Expenses', Value: report.expenses },
      { Metric: 'Net Profit', Value: report.netProfit },
      { Metric: 'Total Invoices', Value: report.invoiceCount },
      { Metric: 'Paid Invoices', Value: report.paidCount },
      { Metric: 'Unpaid Invoices', Value: report.unpaidCount },
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500">
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={handleExport} disabled={!report}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Revenue</span>
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{fmt(report.revenue)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Expenses</span>
              </div>
              <p className="text-xl font-bold text-red-500 dark:text-red-400">{fmt(report.expenses)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Profit</span>
              </div>
              <p className={`text-xl font-bold ${report.netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>
                {fmt(report.netProfit)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Invoices</span>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{report.invoiceCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Paid</span>
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{report.paidCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Unpaid</span>
              </div>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{report.unpaidCount}</p>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Weekly Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={report.weeklyRevenue} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AccountingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('expenses');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'expenses', label: 'Expenses' },
    { id: 'doctor-dues', label: 'Doctor Dues' },
    { id: 'monthly-report', label: 'Monthly Report' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Calculator className="h-6 w-6 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Accounting</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Expenses, doctor dues & monthly reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'expenses' && <ExpensesTab />}
      {activeTab === 'doctor-dues' && <DoctorDuesTab />}
      {activeTab === 'monthly-report' && <MonthlyReportTab />}
    </div>
  );
}
