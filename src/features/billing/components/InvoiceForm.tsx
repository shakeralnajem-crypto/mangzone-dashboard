import { PatientSearchInput } from '@/components/shared/PatientSearchInput';
import { getStatusLabel } from '@/lib/translations';
import type { useT } from '@/lib/translations';

const INV_STATUSES = ['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyForm = any;

interface Props {
  form: AnyForm;
  setForm: (fn: (f: AnyForm) => AnyForm) => void;
  isAr: boolean;
  t: ReturnType<typeof useT>;
  autoTotal: number;
  onSubtotalChange: (v: string) => void;
  onDiscountChange: (v: string) => void;
  onTotalChange: (v: string) => void;
}

export function InvoiceForm({ form, setForm, isAr, t, autoTotal, onSubtotalChange, onDiscountChange, onTotalChange }: Props) {
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
          <input className="ds-input" value={form.invoice_number}
            onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
          />
        </div>
        <div>
          <label className="ds-label">{t.status}</label>
          <select className="ds-input" value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {INV_STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s, isAr)}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label className="ds-label">{t.subtotal} (EGP)</label>
          <input type="number" min="0" step="0.01" className="ds-input" value={form.subtotal}
            onChange={(e) => onSubtotalChange(e.target.value)} placeholder="0"
          />
        </div>
        <div>
          <label className="ds-label">{t.discount} (EGP)</label>
          <input type="number" min="0" step="0.01" className="ds-input" value={form.discount}
            onChange={(e) => onDiscountChange(e.target.value)}
          />
        </div>
        <div>
          <label className="ds-label">
            {t.grandTotal} *
            {autoTotal > 0 && <span style={{ color: 'var(--p3)', fontWeight: 400, marginLeft: 4 }}>({autoTotal})</span>}
          </label>
          <input required type="number" min="0.01" step="0.01" className="ds-input" value={form.total_amount}
            onChange={(e) => onTotalChange(e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="ds-label">{isAr ? 'الرصيد المستحق (ج.م)' : 'Balance Due (EGP)'}</label>
          <input type="number" min="0" step="0.01" className="ds-input" value={form.balance_due}
            onChange={(e) => setForm((f) => ({ ...f, balance_due: e.target.value }))}
          />
        </div>
        <div>
          <label className="ds-label">{t.dueDate}</label>
          <input type="date" className="ds-input" value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className="ds-label">{t.notes}</label>
        <textarea className="ds-input" style={{ resize: 'none' }} rows={2} value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>
    </>
  );
}
