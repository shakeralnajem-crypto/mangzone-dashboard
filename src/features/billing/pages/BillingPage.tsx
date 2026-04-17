import { useState } from 'react';
import {
  ReceiptText,
  Download,
  Plus,
  X,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileText,
  Edit2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useInvoices,
  useBillingStats,
  useCreateInvoice,
  useUpdateInvoice,
} from '@/hooks/useInvoices';
import { PatientSearchInput } from '@/components/shared/PatientSearchInput';
import { PatientDetailModal } from '@/components/shared/PatientDetailModal';
import { formatEGP } from '@/lib/currency';
import { exportToCsv } from '@/lib/exportCsv';
import { useT, getStatusLabel } from '@/lib/translations';
import type { Database } from '@/types/supabase';

type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceWithRelations = Invoice & {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
  doctor: { full_name: string } | null;
  payments: { amount: number; payment_method: string; payment_date: string }[];
};

const INV_STATUS_CLS: Record<string, string> = {
  PAID: 'ds-badge ds-badge-ok',
  UNPAID: 'ds-badge ds-badge-warn',
  PARTIALLY_PAID: 'ds-badge ds-badge-a',
  DRAFT: 'ds-badge ds-badge-neutral',
  CANCELLED: 'ds-badge ds-badge-err',
};

const INV_STATUSES = [
  'DRAFT',
  'UNPAID',
  'PARTIALLY_PAID',
  'PAID',
  'CANCELLED',
] as const;

function deriveInvoiceStatus(
  total: number,
  balance: number
): InvoiceInsert['status'] {
  if (balance <= 0) return 'PAID';
  if (balance >= total) return 'UNPAID';
  return 'PARTIALLY_PAID';
}

// ─── Shared Invoice Form Fields ───────────────────────────────────────────────

function InvoiceForm({
  form,
  setForm,
  isAr,
  t,
  autoTotal,
  onSubtotalChange,
  onDiscountChange,
  onTotalChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  setForm: (fn: (f: any) => any) => void;
  isAr: boolean;
  t: ReturnType<typeof useT>;
  autoTotal: number;
  onSubtotalChange: (v: string) => void;
  onDiscountChange: (v: string) => void;
  onTotalChange: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="ds-label">{t.patient}</label>
        <PatientSearchInput
          value={form.patient_id ?? ''}
          onChange={(id) => setForm((f) => ({ ...f, patient_id: id }))}
          isAr={isAr}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="ds-label">{t.invoiceNumber}</label>
          <input
            className="ds-input"
            value={form.invoice_number}
            onChange={(e) =>
              setForm((f) => ({ ...f, invoice_number: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="ds-label">{t.status}</label>
          <select
            className="ds-input"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {INV_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getStatusLabel(s, isAr)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}
      >
        <div>
          <label className="ds-label">{t.subtotal} (EGP)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="ds-input"
            value={form.subtotal}
            onChange={(e) => onSubtotalChange(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="ds-label">{t.discount} (EGP)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="ds-input"
            value={form.discount}
            onChange={(e) => onDiscountChange(e.target.value)}
          />
        </div>
        <div>
          <label className="ds-label">
            {t.grandTotal} *
            {autoTotal > 0 && (
              <span
                style={{ color: 'var(--p3)', fontWeight: 400, marginLeft: 4 }}
              >
                ({autoTotal})
              </span>
            )}
          </label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            className="ds-input"
            value={form.total_amount}
            onChange={(e) => onTotalChange(e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="ds-label">
            {isAr ? 'الرصيد المستحق (ج.م)' : 'Balance Due (EGP)'}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="ds-input"
            value={form.balance_due}
            onChange={(e) =>
              setForm((f) => ({ ...f, balance_due: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="ds-label">{t.dueDate}</label>
          <input
            type="date"
            className="ds-input"
            value={form.due_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, due_date: e.target.value }))
            }
          />
        </div>
      </div>
      <div>
        <label className="ds-label">{t.notes}</label>
        <textarea
          className="ds-input"
          style={{ resize: 'none' }}
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>
    </>
  );
}

// ─── Add Invoice Modal ────────────────────────────────────────────────────────

function AddInvoiceModal({
  invoiceCount,
  isAr,
  onClose,
}: {
  invoiceCount: number;
  isAr: boolean;
  onClose: () => void;
}) {
  const t = useT(isAr);
  const create = useCreateInvoice();
  const nextNumber = `INV-${String(invoiceCount + 1).padStart(3, '0')}`;

  const [form, setForm] = useState({
    patient_id: '',
    invoice_number: nextNumber,
    subtotal: '',
    discount: '0',
    total_amount: '',
    balance_due: '',
    status: 'UNPAID',
    due_date: '',
    notes: '',
  });
  const [submitError, setSubmitError] = useState('');

  const subtotalNum = parseFloat(form.subtotal) || 0;
  const discountNum = parseFloat(form.discount) || 0;
  const autoTotal = subtotalNum - discountNum;

  const onSubtotalChange = (v: string) => {
    const sub = parseFloat(v) || 0;
    const disc = parseFloat(form.discount) || 0;
    const total = sub - disc;
    setForm((f) => ({
      ...f,
      subtotal: v,
      total_amount: total > 0 ? String(total) : '0',
      balance_due: total > 0 ? String(total) : '0',
    }));
  };
  const onDiscountChange = (v: string) => {
    const sub = parseFloat(form.subtotal) || 0;
    const disc = parseFloat(v) || 0;
    const total = sub - disc;
    setForm((f) => ({
      ...f,
      discount: v,
      total_amount: total > 0 ? String(total) : '0',
      balance_due: total > 0 ? String(total) : '0',
    }));
  };
  const onTotalChange = (v: string) =>
    setForm((f) => ({ ...f, total_amount: v, balance_due: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const total = parseFloat(form.total_amount);
    const balanceRaw = parseFloat(form.balance_due);
    const balance = Number.isNaN(balanceRaw) ? total : balanceRaw;

    if (isNaN(total) || total <= 0) {
      setSubmitError(
        isAr
          ? 'يجب أن يكون الإجمالي أكبر من 0.'
          : 'Total amount must be greater than 0.'
      );
      return;
    }
    if (isNaN(balance) || balance < 0 || balance > total) {
      setSubmitError(
        isAr
          ? 'الرصيد المستحق يجب أن يكون بين 0 والإجمالي.'
          : 'Balance due must be between 0 and total.'
      );
      return;
    }

    const expectedStatus = deriveInvoiceStatus(total, balance);
    if (form.status === 'PAID' && balance > 0) {
      setSubmitError(
        isAr
          ? 'الفاتورة المدفوعة يجب أن يكون رصيدها 0.'
          : 'PAID invoice must have zero balance.'
      );
      return;
    }
    if (
      (form.status === 'UNPAID' || form.status === 'DRAFT') &&
      balance < total
    ) {
      setSubmitError(
        isAr
          ? 'الفاتورة غير المدفوعة/المسودة يجب أن يبقى رصيدها كاملًا.'
          : 'UNPAID/DRAFT invoice must keep full balance.'
      );
      return;
    }
    if (
      form.status === 'PARTIALLY_PAID' &&
      (balance <= 0 || balance >= total)
    ) {
      setSubmitError(
        isAr
          ? 'الفاتورة المدفوعة جزئيًا يجب أن يكون رصيدها بين 0 والإجمالي.'
          : 'PARTIALLY_PAID invoice must have balance between 0 and total.'
      );
      return;
    }
    if (form.status === 'CANCELLED' && balance !== total) {
      setSubmitError(
        isAr
          ? 'الفاتورة الملغاة يجب أن تحتفظ بكامل الرصيد.'
          : 'CANCELLED invoice must keep full balance.'
      );
      return;
    }

    try {
      await create.mutateAsync({
        patient_id: form.patient_id || null,
        invoice_number: form.invoice_number,
        subtotal: subtotalNum || null,
        discount: discountNum || null,
        total_amount: total,
        balance_due: balance,
        status: (form.status || expectedStatus) as InvoiceInsert['status'],
        due_date: form.due_date || null,
        notes: form.notes || null,
      });
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : isAr
            ? 'فشل إنشاء الفاتورة.'
            : 'Failed to create invoice.'
      );
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 520 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {t.addInvoice}
          </span>
          <button className="ds-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <InvoiceForm
            form={form}
            setForm={setForm}
            isAr={isAr}
            t={t}
            autoTotal={autoTotal}
            onSubtotalChange={onSubtotalChange}
            onDiscountChange={onDiscountChange}
            onTotalChange={onTotalChange}
          />
          {submitError && <p className="ds-error">{submitError}</p>}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={create.isPending}
              className="ds-btn ds-btn-primary"
              style={{ flex: 1 }}
            >
              {create.isPending
                ? isAr
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : t.addInvoice}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ds-btn ds-btn-ghost"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Invoice Modal ───────────────────────────────────────────────────────

function EditInvoiceModal({
  invoice,
  isAr,
  onClose,
}: {
  invoice: InvoiceWithRelations;
  isAr: boolean;
  onClose: () => void;
}) {
  const t = useT(isAr);
  const update = useUpdateInvoice();

  const [form, setForm] = useState({
    patient_id: invoice.patient_id ?? '',
    invoice_number: invoice.invoice_number ?? '',
    subtotal: invoice.subtotal != null ? String(invoice.subtotal) : '',
    discount: invoice.discount != null ? String(invoice.discount) : '0',
    total_amount: String(invoice.total_amount),
    balance_due: String(invoice.balance_due),
    status: invoice.status ?? 'UNPAID',
    due_date: invoice.due_date ?? '',
    notes: invoice.notes ?? '',
  });
  const [submitError, setSubmitError] = useState('');

  const subtotalNum = parseFloat(form.subtotal) || 0;
  const discountNum = parseFloat(form.discount) || 0;
  const autoTotal = subtotalNum - discountNum;

  const onSubtotalChange = (v: string) => {
    const sub = parseFloat(v) || 0;
    const disc = parseFloat(form.discount) || 0;
    const total = sub - disc;
    setForm((f) => ({
      ...f,
      subtotal: v,
      total_amount: total > 0 ? String(total) : '0',
      balance_due: total > 0 ? String(total) : '0',
    }));
  };
  const onDiscountChange = (v: string) => {
    const sub = parseFloat(form.subtotal) || 0;
    const disc = parseFloat(v) || 0;
    const total = sub - disc;
    setForm((f) => ({
      ...f,
      discount: v,
      total_amount: total > 0 ? String(total) : '0',
      balance_due: total > 0 ? String(total) : '0',
    }));
  };
  const onTotalChange = (v: string) =>
    setForm((f) => ({ ...f, total_amount: v, balance_due: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const total = parseFloat(form.total_amount);
    const balanceRaw = parseFloat(form.balance_due);
    const balance = Number.isNaN(balanceRaw) ? total : balanceRaw;

    if (isNaN(total) || total <= 0) {
      setSubmitError(
        isAr
          ? 'يجب أن يكون الإجمالي أكبر من 0.'
          : 'Total amount must be greater than 0.'
      );
      return;
    }
    if (isNaN(balance) || balance < 0 || balance > total) {
      setSubmitError(
        isAr
          ? 'الرصيد المستحق يجب أن يكون بين 0 والإجمالي.'
          : 'Balance due must be between 0 and total.'
      );
      return;
    }

    const expectedStatus = deriveInvoiceStatus(total, balance);
    if (form.status === 'PAID' && balance > 0) {
      setSubmitError(
        isAr
          ? 'الفاتورة المدفوعة يجب أن يكون رصيدها 0.'
          : 'PAID invoice must have zero balance.'
      );
      return;
    }
    if (
      (form.status === 'UNPAID' || form.status === 'DRAFT') &&
      balance < total
    ) {
      setSubmitError(
        isAr
          ? 'الفاتورة غير المدفوعة/المسودة يجب أن يبقى رصيدها كاملًا.'
          : 'UNPAID/DRAFT invoice must keep full balance.'
      );
      return;
    }
    if (
      form.status === 'PARTIALLY_PAID' &&
      (balance <= 0 || balance >= total)
    ) {
      setSubmitError(
        isAr
          ? 'الفاتورة المدفوعة جزئيًا يجب أن يكون رصيدها بين 0 والإجمالي.'
          : 'PARTIALLY_PAID invoice must have balance between 0 and total.'
      );
      return;
    }
    if (form.status === 'CANCELLED' && balance !== total) {
      setSubmitError(
        isAr
          ? 'الفاتورة الملغاة يجب أن تحتفظ بكامل الرصيد.'
          : 'CANCELLED invoice must keep full balance.'
      );
      return;
    }

    try {
      await update.mutateAsync({
        id: invoice.id,
        patient_id: form.patient_id || null,
        invoice_number: form.invoice_number,
        subtotal: subtotalNum || null,
        discount: discountNum || null,
        total_amount: total,
        balance_due: balance,
        status: (form.status || expectedStatus) as InvoiceInsert['status'],
        due_date: form.due_date || null,
        notes: form.notes || null,
      });
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : isAr
            ? 'فشل تحديث الفاتورة.'
            : 'Failed to update invoice.'
      );
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 520 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {isAr ? 'تعديل الفاتورة' : 'Edit Invoice'} —{' '}
            {invoice.invoice_number}
          </span>
          <button className="ds-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <InvoiceForm
            form={form}
            setForm={setForm}
            isAr={isAr}
            t={t}
            autoTotal={autoTotal}
            onSubtotalChange={onSubtotalChange}
            onDiscountChange={onDiscountChange}
            onTotalChange={onTotalChange}
          />
          {submitError && <p className="ds-error">{submitError}</p>}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={update.isPending}
              className="ds-btn ds-btn-primary"
              style={{ flex: 1 }}
            >
              {update.isPending
                ? isAr
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : t.save}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ds-btn ds-btn-ghost"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function BillingPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [addOpen, setAddOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] =
    useState<InvoiceWithRelations | null>(null);
  const [detailPatient, setDetailPatient] = useState<{ id: string; [key: string]: unknown } | null>(null);
  const { data: invoices = [], isLoading, error } = useInvoices();
  const { data: stats } = useBillingStats();
  const errorMessage =
    error instanceof Error
      ? error.message
      : isAr
        ? 'فشل تحميل الفواتير.'
        : 'Failed to load invoices.';

  const handleExport = () => {
    exportToCsv(
      'invoices',
      invoices.map((inv) => ({
        'Invoice #': inv.invoice_number ?? '',
        Patient: inv.patient
          ? `${inv.patient.first_name} ${inv.patient.last_name}`
          : '',
        'Total (EGP)': inv.total_amount,
        'Balance Due (EGP)': inv.balance_due,
        Status: inv.status ?? '',
        'Due Date': inv.due_date ?? '',
        'Created At': inv.created_at,
      }))
    );
  };

  const statCards = [
    {
      label: isAr ? 'إيرادات اليوم' : "Today's Revenue",
      value: formatEGP(stats?.todayRevenue ?? 0),
      Icon: TrendingUp,
      cls: 'ds-stat-ok',
    },
    {
      label: isAr ? 'إيرادات الشهر' : "This Month's Revenue",
      value: formatEGP(stats?.monthRevenue ?? 0),
      Icon: Clock,
      cls: 'ds-stat-p',
    },
    {
      label: isAr ? 'المبلغ المعلق' : 'Pending Amount',
      value: formatEGP(stats?.pendingAmount ?? 0),
      Icon: AlertTriangle,
      cls: 'ds-stat-warn',
    },
    {
      label: isAr ? 'إجمالي الفواتير' : 'Total Invoices',
      value: String(stats?.totalInvoices ?? '—'),
      Icon: FileText,
      cls: 'ds-stat-a',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            className="ds-badge ds-badge-p"
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            {invoices.length} {isAr ? 'فاتورة' : 'invoices'}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleExport}
            className="ds-btn ds-btn-ghost"
            style={{ gap: 6 }}
          >
            <Download size={14} /> {isAr ? 'تصدير CSV' : 'Export CSV'}
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="ds-btn ds-btn-primary"
            style={{ gap: 6 }}
          >
            <Plus size={14} strokeWidth={2.5} /> {t.addInvoice}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {statCards.map((card) => (
          <div key={card.label} className={`ds-stat ${card.cls}`}>
            <div className="ds-stat-icon">
              <card.Icon size={18} />
            </div>
            <div>
              <div className="ds-stat-label">{card.label}</div>
              <div className="ds-stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice table */}
      {isLoading ? (
        <div
          className="ds-card"
          style={{
            padding: '60px 0',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div className="ds-spinner" />
        </div>
      ) : error ? (
        <div
          className="ds-card"
          style={{
            padding: 18,
            background: 'var(--err-soft)',
            border: '1px solid var(--err)',
            color: 'var(--err)',
          }}
        >
          {errorMessage}
        </div>
      ) : invoices.length === 0 ? (
        <div className="ds-empty">
          <ReceiptText
            size={40}
            style={{ color: 'var(--txt3)', marginBottom: 12 }}
          />
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--txt)',
              marginBottom: 6,
            }}
          >
            {t.noInvoicesFound}
          </p>
          <p style={{ fontSize: 13, color: 'var(--txt3)', marginBottom: 16 }}>
            {t.addFirstInvoice}
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="ds-btn ds-btn-primary"
            style={{ gap: 6 }}
          >
            <Plus size={14} strokeWidth={2.5} /> {t.addInvoice}
          </button>
        </div>
      ) : (
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th className="ds-th">{isAr ? 'الفاتورة' : 'Invoice'}</th>
                <th className="ds-th">{t.patient}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>
                  {t.total}
                </th>
                <th className="ds-th">{t.status}</th>
                <th className="ds-th">{t.dueDate}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="ds-tbody-row">
                  <td className="ds-td">
                    <p
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--txt)',
                      }}
                    >
                      {inv.invoice_number || '—'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                      {new Date(inv.created_at).toLocaleDateString('en-EG', {
                        dateStyle: 'medium',
                      })}
                    </p>
                  </td>
                  <td className="ds-td">
                    {inv.patient ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="ds-avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                          {inv.patient.first_name.charAt(0)}
                          {inv.patient.last_name.charAt(0)}
                        </div>
                        <button
                          onClick={() => setDetailPatient(inv.patient as typeof detailPatient)}
                          style={{ fontSize: 13, fontWeight: 600, color: 'var(--p2)',
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
                        >
                          {inv.patient.first_name} {inv.patient.last_name}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--txt3)' }}>—</span>
                    )}
                  </td>
                  <td className="ds-td" style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--txt)',
                      }}
                    >
                      {formatEGP(inv.total_amount)}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                      {isAr ? 'الرصيد:' : 'Balance:'}{' '}
                      {formatEGP(inv.balance_due)}
                    </p>
                  </td>
                  <td className="ds-td">
                    <span
                      className={
                        INV_STATUS_CLS[inv.status ?? 'UNPAID'] ??
                        'ds-badge ds-badge-neutral'
                      }
                    >
                      {getStatusLabel(inv.status ?? 'UNPAID', isAr)}
                    </span>
                  </td>
                  <td
                    className="ds-td"
                    style={{ fontSize: 13, color: 'var(--txt2)' }}
                  >
                    {inv.due_date
                      ? new Date(inv.due_date).toLocaleDateString('en-EG', {
                          dateStyle: 'medium',
                        })
                      : '—'}
                  </td>
                  <td className="ds-td">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 4,
                      }}
                    >
                      <button
                        onClick={() => setEditingInvoice(inv)}
                        className="ds-icon-btn"
                        title={t.edit}
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && (
        <AddInvoiceModal
          invoiceCount={invoices.length}
          isAr={isAr}
          onClose={() => setAddOpen(false)}
        />
      )}
      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          isAr={isAr}
          onClose={() => setEditingInvoice(null)}
        />
      )}
      <PatientDetailModal
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
      />
    </div>
  );
}
