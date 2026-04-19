import { useState } from 'react';
import { X } from 'lucide-react';
import { useUpdateInvoice } from '@/hooks/useInvoices';
import { useT } from '@/lib/translations';
import type { Database } from '@/types/supabase';
import { InvoiceForm } from './InvoiceForm';
import { deriveInvoiceStatus, validateInvoiceStatusBalance } from './invoiceValidation';

type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceWithRelations = Invoice & {
  patient: { id: string; first_name: string; last_name: string; phone: string | null } | null;
  doctor: { full_name: string } | null;
  payments: { amount: number; payment_method: string; payment_date: string }[];
};

interface Props {
  invoice: InvoiceWithRelations;
  isAr: boolean;
  onClose: () => void;
}

export function EditInvoiceModal({ invoice, isAr, onClose }: Props) {
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
    setForm((f) => ({ ...f, subtotal: v, total_amount: total > 0 ? String(total) : '0', balance_due: total > 0 ? String(total) : '0' }));
  };
  const onDiscountChange = (v: string) => {
    const sub = parseFloat(form.subtotal) || 0;
    const disc = parseFloat(v) || 0;
    const total = sub - disc;
    setForm((f) => ({ ...f, discount: v, total_amount: total > 0 ? String(total) : '0', balance_due: total > 0 ? String(total) : '0' }));
  };
  const onTotalChange = (v: string) => setForm((f) => ({ ...f, total_amount: v, balance_due: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const total = parseFloat(form.total_amount);
    const balanceRaw = parseFloat(form.balance_due);
    const balance = Number.isNaN(balanceRaw) ? total : balanceRaw;

    const validationError = validateInvoiceStatusBalance(form.status, total, balance, isAr);
    if (validationError) { setSubmitError(validationError); return; }

    try {
      await update.mutateAsync({
        id: invoice.id,
        patient_id: form.patient_id || null,
        invoice_number: form.invoice_number,
        subtotal: subtotalNum || null,
        discount: discountNum || null,
        total_amount: total,
        balance_due: balance,
        status: (form.status || deriveInvoiceStatus(total, balance)) as InvoiceInsert['status'],
        due_date: form.due_date || null,
        notes: form.notes || null,
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : (isAr ? 'فشل تحديث الفاتورة.' : 'Failed to update invoice.'));
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 520 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {isAr ? 'تعديل الفاتورة' : 'Edit Invoice'} — {invoice.invoice_number}
          </span>
          <button className="ds-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InvoiceForm form={form} setForm={setForm} isAr={isAr} t={t} autoTotal={autoTotal}
            onSubtotalChange={onSubtotalChange} onDiscountChange={onDiscountChange} onTotalChange={onTotalChange}
          />
          {submitError && <p className="ds-error">{submitError}</p>}
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
