import { useState } from 'react';
import { ReceiptText, Download, Plus, TrendingUp, Clock, AlertTriangle, FileText, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInvoices, useBillingStats } from '@/hooks/useInvoices';
import { PatientDetailModal } from '@/components/shared/PatientDetailModal';
import { formatEGP } from '@/lib/currency';
import { exportToCsv } from '@/lib/exportCsv';
import { useT, getStatusLabel } from '@/lib/translations';
import type { Database } from '@/types/supabase';

import { AddInvoiceModal } from '../components/AddInvoiceModal';
import { EditInvoiceModal } from '../components/EditInvoiceModal';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceWithRelations = Invoice & {
  patient: { id: string; first_name: string; last_name: string; phone: string | null } | null;
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

export function BillingPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [addOpen, setAddOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [detailPatient, setDetailPatient] = useState<{ id: string; [key: string]: unknown } | null>(null);

  const { data: invoices = [], isLoading, error } = useInvoices();
  const { data: stats } = useBillingStats();
  const errorMessage = error instanceof Error ? error.message : (isAr ? 'فشل تحميل الفواتير.' : 'Failed to load invoices.');

  const handleExport = () => {
    exportToCsv('invoices', invoices.map((inv) => ({
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
    { label: isAr ? 'إيرادات اليوم' : "Today's Revenue", value: formatEGP(stats?.todayRevenue ?? 0), Icon: TrendingUp, cls: 'ds-stat-ok' },
    { label: isAr ? 'إيرادات الشهر' : "This Month's Revenue", value: formatEGP(stats?.monthRevenue ?? 0), Icon: Clock, cls: 'ds-stat-p' },
    { label: isAr ? 'المبلغ المعلق' : 'Pending Amount', value: formatEGP(stats?.pendingAmount ?? 0), Icon: AlertTriangle, cls: 'ds-stat-warn' },
    { label: isAr ? 'إجمالي الفواتير' : 'Total Invoices', value: String(stats?.totalInvoices ?? '—'), Icon: FileText, cls: 'ds-stat-a' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span className="ds-badge ds-badge-p" style={{ fontSize: 12, padding: '4px 10px' }}>
            {invoices.length} {isAr ? 'فاتورة' : 'invoices'}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={handleExport} className="ds-btn ds-btn-ghost" style={{ gap: 6 }}>
            <Download size={14} /> {isAr ? 'تصدير CSV' : 'Export CSV'}
          </button>
          <button onClick={() => setAddOpen(true)} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addInvoice}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {statCards.map((card) => (
          <div key={card.label} className={`ds-stat ${card.cls}`}>
            <div className="ds-stat-icon"><card.Icon size={18} /></div>
            <div>
              <div className="ds-stat-label">{card.label}</div>
              <div className="ds-stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice table */}
      {isLoading ? (
        <div className="ds-card" style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : error ? (
        <div className="ds-card" style={{ padding: 18, background: 'var(--err-soft)', border: '1px solid var(--err)', color: 'var(--err)' }}>
          {errorMessage}
        </div>
      ) : invoices.length === 0 ? (
        <div className="ds-empty">
          <ReceiptText size={40} style={{ color: 'var(--txt3)', marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>{t.noInvoicesFound}</p>
          <p style={{ fontSize: 13, color: 'var(--txt3)', marginBottom: 16 }}>{t.addFirstInvoice}</p>
          <button onClick={() => setAddOpen(true)} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addInvoice}
          </button>
        </div>
      ) : (
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th className="ds-th">{isAr ? 'الفاتورة' : 'Invoice'}</th>
                  <th className="ds-th">{t.patient}</th>
                  <th className="ds-th" style={{ textAlign: 'right' }}>{t.total}</th>
                  <th className="ds-th">{t.status}</th>
                  <th className="ds-th mobile-hide">{t.dueDate}</th>
                  <th className="ds-th" style={{ textAlign: 'right' }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="ds-tbody-row">
                    <td className="ds-td">
                      <p style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>
                        {inv.invoice_number || '—'}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                        {new Date(inv.created_at).toLocaleDateString('en-EG', { dateStyle: 'medium' })}
                      </p>
                    </td>
                    <td className="ds-td">
                      {inv.patient ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="ds-avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                            {inv.patient.first_name.charAt(0)}{inv.patient.last_name.charAt(0)}
                          </div>
                          <button
                            type="button"
                            onClick={() => setDetailPatient(inv.patient as typeof detailPatient)}
                            style={{ fontSize: 13, fontWeight: 600, color: 'var(--p2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
                          >
                            {inv.patient.first_name} {inv.patient.last_name}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--txt3)' }}>—</span>
                      )}
                    </td>
                    <td className="ds-td" style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{formatEGP(inv.total_amount)}</p>
                      <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                        {isAr ? 'الرصيد:' : 'Balance:'} {formatEGP(inv.balance_due)}
                      </p>
                    </td>
                    <td className="ds-td">
                      <span className={INV_STATUS_CLS[inv.status ?? 'UNPAID'] ?? 'ds-badge ds-badge-neutral'}>
                        {getStatusLabel(inv.status ?? 'UNPAID', isAr)}
                      </span>
                    </td>
                    <td className="ds-td mobile-hide" style={{ fontSize: 13, color: 'var(--txt2)' }}>
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-EG', { dateStyle: 'medium' }) : '—'}
                    </td>
                    <td className="ds-td">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <button onClick={() => setEditingInvoice(inv)} className="ds-icon-btn" title={t.edit}>
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addOpen && <AddInvoiceModal invoiceCount={invoices.length} isAr={isAr} onClose={() => setAddOpen(false)} />}
      {editingInvoice && <EditInvoiceModal invoice={editingInvoice} isAr={isAr} onClose={() => setEditingInvoice(null)} />}
      <PatientDetailModal patient={detailPatient} onClose={() => setDetailPatient(null)} />
    </div>
  );
}
