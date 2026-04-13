import { useState } from 'react';
import { Plus, Trash2, Download, X, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import {
  useExpenses,
  useCreateExpense,
  useDeleteExpense,
  useDoctorDues,
  useMonthlyReport,
} from '@/hooks/useAccounting';
import { useTranslation } from 'react-i18next';
import { useT } from '@/lib/translations';
import { useHistoryStore } from '@/store/historyStore';
import { exportToCsv } from '@/lib/exportCsv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Tab = 'expenses' | 'doctor-dues' | 'monthly-report';

const EXPENSE_CATEGORIES_EN = ['Rent', 'Salaries', 'Supplies', 'Equipment', 'Marketing', 'Utilities', 'Other'];
const EXPENSE_CATEGORIES_AR = ['إيجار', 'رواتب', 'مستلزمات', 'معدات', 'تسويق', 'مرافق', 'أخرى'];

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

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

function ExpensesTab({ isAr }: { isAr: boolean }) {
  const t = useT(isAr);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyExpenseForm });

  const { data: expenses = [], isLoading } = useExpenses(year, month);
  const create = useCreateExpense();
  const remove = useDeleteExpense();
  const { pushAction } = useHistoryStore();

  const months = isAr ? MONTHS_AR : MONTHS_EN;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select className="ds-input" style={{ width: 110 }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="ds-input" style={{ width: 90 }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt2)' }}>
            {isAr ? 'الإجمالي:' : 'Total:'} {fmt(total)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} className="ds-btn ds-btn-ghost" style={{ gap: 6 }}>
            <Download size={14} /> {isAr ? 'تصدير' : 'Export'}
          </button>
          <button onClick={() => setShowForm(true)} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} /> {t.addExpense}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="ds-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{t.addExpense}</span>
            <button className="ds-modal-close" onClick={() => setShowForm(false)}><X size={15} /></button>
          </div>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label className="ds-label">{t.category} *</label>
                <select required className="ds-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {EXPENSE_CATEGORIES_EN.map((c, i) => (
                    <option key={c} value={c}>{isAr ? EXPENSE_CATEGORIES_AR[i] : c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ds-label">{t.amount} (EGP) *</label>
                <input required type="number" min="0" step="0.01" className="ds-input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="ds-label">{t.date} *</label>
                <input required type="date" className="ds-input" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
              </div>
              <div>
                <label className="ds-label">{t.description}</label>
                <input className="ds-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="ds-label">{isAr ? 'مدفوع لـ' : 'Paid To'}</label>
                <input className="ds-input" value={form.paid_to} onChange={e => setForm(f => ({ ...f, paid_to: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={create.isPending} className="ds-btn ds-btn-primary">
                {create.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : t.save}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="ds-btn ds-btn-ghost">{t.cancel}</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="ds-card" style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="ds-empty" style={{ padding: '40px 24px' }}>
          <p style={{ fontSize: 14, color: 'var(--txt3)' }}>
            {isAr ? 'لا توجد مصروفات مسجلة لهذا الشهر.' : 'No expenses recorded for this month.'}
          </p>
        </div>
      ) : (
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th className="ds-th">{t.category}</th>
                <th className="ds-th">{t.description}</th>
                <th className="ds-th">{t.date}</th>
                <th className="ds-th">{isAr ? 'مدفوع لـ' : 'Paid To'}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>{t.amount}</th>
                <th className="ds-th" />
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => {
                const catIndex = EXPENSE_CATEGORIES_EN.indexOf(exp.category);
                const catLabel = isAr && catIndex >= 0 ? EXPENSE_CATEGORIES_AR[catIndex] : exp.category;
                return (
                  <tr key={exp.id} className="ds-tbody-row">
                    <td className="ds-td">
                      <span className="ds-badge ds-badge-neutral">{catLabel}</span>
                    </td>
                    <td className="ds-td" style={{ fontSize: 13, color: 'var(--txt2)' }}>{exp.description || '—'}</td>
                    <td className="ds-td" style={{ fontSize: 12, color: 'var(--txt3)' }}>{exp.expense_date}</td>
                    <td className="ds-td" style={{ fontSize: 12, color: 'var(--txt3)' }}>{exp.paid_to || '—'}</td>
                    <td className="ds-td" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--txt)' }}>{fmt(exp.amount)}</td>
                    <td className="ds-td" style={{ textAlign: 'right' }}>
                      <button onClick={async () => {
                        await remove.mutateAsync(exp.id);
                        let restoredId = exp.id;
                        pushAction({
                          id: crypto.randomUUID(),
                          timestamp: Date.now(),
                          description: `Deleted expense: ${exp.category} ${exp.amount} EGP`,
                          description_ar: `حُذف مصروف: ${exp.category} ${exp.amount} ج.م`,
                          undo: async () => {
                            const created = await create.mutateAsync({
                              category: exp.category,
                              description: exp.description,
                              amount: exp.amount,
                              expense_date: exp.expense_date,
                              paid_to: exp.paid_to,
                              notes: exp.notes,
                            });
                            restoredId = created.id;
                          },
                          redo: async () => { await remove.mutateAsync(restoredId); },
                        });
                      }} className="ds-icon-btn-err">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Doctor Dues Tab ─────────────────────────────────────────────────────────

function DoctorDuesTab({ isAr }: { isAr: boolean }) {
  const t = useT(isAr);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt2)' }}>{t.clinicPercent}</label>
          <input
            type="number" min={0} max={100}
            className="ds-input" style={{ width: 80 }}
            value={clinicPercent}
            onChange={e => setClinicPercent(Number(e.target.value))}
          />
          <span style={{ fontSize: 12, color: 'var(--txt3)' }}>
            {isAr ? `الطبيب يأخذ ${100 - clinicPercent}%` : `Doctor gets ${100 - clinicPercent}%`}
          </span>
        </div>
        <button onClick={handleExport} className="ds-btn ds-btn-ghost" style={{ gap: 6 }}>
          <Download size={14} /> {isAr ? 'تصدير CSV' : 'Export CSV'}
        </button>
      </div>

      {isLoading ? (
        <div className="ds-card" style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : dues.length === 0 ? (
        <div className="ds-empty" style={{ padding: '40px 24px' }}>
          <p style={{ fontSize: 14, color: 'var(--txt3)' }}>
            {isAr ? 'لا توجد فواتير مدفوعة مع أطباء مخصصين.' : 'No paid invoices with assigned doctors found.'}
          </p>
        </div>
      ) : (
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th className="ds-th">{t.doctor}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>{isAr ? 'الفواتير' : 'Invoices'}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>{isAr ? 'إجمالي الفواتير' : 'Total Billed'}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>
                  {isAr ? `العيادة (${clinicPercent}%)` : `Clinic (${clinicPercent}%)`}
                </th>
                <th className="ds-th" style={{ textAlign: 'right' }}>
                  {isAr ? `مستحق الطبيب (${100 - clinicPercent}%)` : `Doctor Due (${100 - clinicPercent}%)`}
                </th>
              </tr>
            </thead>
            <tbody>
              {dues.map(d => (
                <tr key={d.doctorId} className="ds-tbody-row">
                  <td className="ds-td" style={{ fontWeight: 600, color: 'var(--txt)' }}>{d.doctorName}</td>
                  <td className="ds-td" style={{ textAlign: 'right', color: 'var(--txt2)' }}>{d.invoiceCount}</td>
                  <td className="ds-td" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--txt)' }}>{fmt(d.totalBilled)}</td>
                  <td className="ds-td" style={{ textAlign: 'right', color: 'var(--txt2)' }}>{fmt(d.clinicShare)}</td>
                  <td className="ds-td" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ok)' }}>{fmt(d.doctorDue)}</td>
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

function MonthlyReportTab({ isAr }: { isAr: boolean }) {
  const t = useT(isAr);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data: report, isLoading } = useMonthlyReport(year, month);

  const months = isAr ? MONTHS_AR : MONTHS_EN;

  const handleExport = () => {
    if (!report) return;
    exportToCsv(`monthly_report_${year}_${String(month).padStart(2, '0')}`, [
      { Metric: 'Revenue',        Value: report.revenue },
      { Metric: 'Expenses',       Value: report.expenses },
      { Metric: 'Net Profit',     Value: report.netProfit },
      { Metric: 'Total Invoices', Value: report.invoiceCount },
      { Metric: 'Paid Invoices',  Value: report.paidCount },
      { Metric: 'Unpaid Invoices',Value: report.unpaidCount },
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select className="ds-input" style={{ width: 110 }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="ds-input" style={{ width: 90 }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={handleExport} disabled={!report} className="ds-btn ds-btn-ghost" style={{ gap: 6 }}>
          <Download size={14} /> {isAr ? 'تصدير CSV' : 'Export CSV'}
        </button>
      </div>

      {isLoading ? (
        <div className="ds-card" style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : report ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {[
              { icon: TrendingUp,   label: isAr ? 'الإيرادات'   : 'Revenue',        value: fmt(report.revenue),         cls: 'ds-stat-ok' },
              { icon: TrendingDown, label: isAr ? 'المصروفات'   : 'Expenses',       value: fmt(report.expenses),        cls: 'ds-stat-err' },
              { icon: DollarSign,   label: t.netProfit,                              value: fmt(report.netProfit),       cls: report.netProfit >= 0 ? 'ds-stat-p' : 'ds-stat-err' },
              { icon: FileText,     label: isAr ? 'الفواتير'    : 'Invoices',       value: String(report.invoiceCount), cls: 'ds-stat-a' },
              { icon: FileText,     label: isAr ? 'مدفوعة'      : 'Paid',           value: String(report.paidCount),    cls: 'ds-stat-ok' },
              { icon: FileText,     label: isAr ? 'غير مدفوعة'  : 'Unpaid',         value: String(report.unpaidCount),  cls: 'ds-stat-warn' },
            ].map(item => (
              <div key={item.label} className={`ds-stat ${item.cls}`}>
                <div className="ds-stat-icon"><item.icon size={16} /></div>
                <div>
                  <div className="ds-stat-label">{item.label}</div>
                  <div className="ds-stat-value" style={{ fontSize: 18 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="ds-card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 16 }}>
              {isAr ? 'الإيرادات والمصروفات الأسبوعية' : 'Weekly Revenue vs Expenses'}
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={report.weeklyRevenue} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--brd)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--txt3)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--txt3)' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 10 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" name={isAr ? 'الإيرادات' : 'Revenue'} fill="#6D28D9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name={isAr ? 'المصروفات' : 'Expenses'} fill="#DC2626" radius={[4, 4, 0, 0]} />
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
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [activeTab, setActiveTab] = useState<Tab>('expenses');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'expenses',       label: t.expenses },
    { id: 'doctor-dues',    label: t.doctorDues },
    { id: 'monthly-report', label: t.monthlyReport },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease' }}>

      {/* Tab bar */}
      <div className="ds-card" style={{ padding: '0 8px' }}>
        <div className="ds-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ds-tab${activeTab === tab.id ? ' active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'expenses'       && <ExpensesTab isAr={isAr} />}
      {activeTab === 'doctor-dues'    && <DoctorDuesTab isAr={isAr} />}
      {activeTab === 'monthly-report' && <MonthlyReportTab isAr={isAr} />}
    </div>
  );
}
