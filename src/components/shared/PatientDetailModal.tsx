import { useState } from 'react';
import { X, Calendar, ReceiptText, CreditCard, User } from 'lucide-react';
import { usePatientAppointments, usePatientInvoices, usePatientPayments } from '@/hooks/usePatientDetail';
import { formatEGP } from '@/lib/currency';
import type { Database } from '@/types/supabase';

type Patient = Database['public']['Tables']['patients']['Row'];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ARRIVED:     'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  NO_SHOW:     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  PAID:            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UNPAID:          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PARTIALLY_PAID:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DRAFT:           'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  CANCELLED_INV:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  INSTAPAY: 'InstaPay',
  VODAFONE_CASH: 'Vodafone Cash',
};

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

interface Props {
  patient: Patient | null;
  onClose: () => void;
}

type Tab = 'appointments' | 'invoices' | 'payments';

export function PatientDetailModal({ patient, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('appointments');

  const { data: appointments = [], isLoading: apptLoading } = usePatientAppointments(patient?.id ?? null);
  const { data: invoices = [], isLoading: invLoading } = usePatientInvoices(patient?.id ?? null);
  const { data: payments = [], isLoading: payLoading } = usePatientPayments(patient?.id ?? null);

  if (!patient) return null;

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
    { id: 'invoices',     label: 'Invoices',     icon: ReceiptText, count: invoices.length },
    { id: 'payments',     label: 'Payments',     icon: CreditCard, count: payments.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 text-lg font-bold text-brand-700 dark:from-brand-900/40 dark:to-brand-800/40 dark:text-brand-300">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {patient.first_name} {patient.last_name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {patient.phone}
                  </span>
                )}
                {patient.gender && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {patient.gender}
                  </span>
                )}
                {patient.dob && (
                  <span>DOB: {new Date(patient.dob).toLocaleDateString('en-EG', { dateStyle: 'medium' })}</span>
                )}
              </div>
              {patient.notes && (
                <p className="mt-1.5 max-w-md text-xs text-slate-400 dark:text-slate-500 line-clamp-2">
                  {patient.notes}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 dark:border-slate-700 flex-shrink-0">
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
              <tab.icon className="h-4 w-4" />
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

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            apptLoading ? <Spinner /> :
            appointments.length === 0 ? (
              <div className="py-14 text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-200 dark:text-slate-700" />
                <p className="text-sm text-slate-400">No appointments on record.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {appointments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {new Date(a.start_time).toLocaleDateString('en-EG', { dateStyle: 'medium' })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(a.start_time).toLocaleTimeString('en-EG', { timeStyle: 'short' })}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{a.doctor?.full_name ?? '—'}</td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{a.service?.name ?? '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[a.status ?? 'SCHEDULED'] ?? ''}`}>
                          {(a.status ?? 'SCHEDULED').replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            invLoading ? <Spinner /> :
            invoices.length === 0 ? (
              <div className="py-14 text-center">
                <ReceiptText className="mx-auto mb-2 h-8 w-8 text-slate-200 dark:text-slate-700" />
                <p className="text-sm text-slate-400">No invoices on record.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Invoice #</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Balance Due</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {inv.invoice_number || '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {formatEGP(inv.total_amount)}
                      </td>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400">
                        {formatEGP(inv.balance_due)}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[inv.status ?? 'UNPAID'] ?? ''}`}>
                          {(inv.status ?? 'UNPAID').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-EG', { dateStyle: 'medium' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            payLoading ? <Spinner /> :
            payments.length === 0 ? (
              <div className="py-14 text-center">
                <CreditCard className="mx-auto mb-2 h-8 w-8 text-slate-200 dark:text-slate-700" />
                <p className="text-sm text-slate-400">No payments on record.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3 text-slate-700 dark:text-slate-200">
                        {new Date(p.payment_date).toLocaleDateString('en-EG', { dateStyle: 'medium' })}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                        {formatEGP(p.amount)}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-400 dark:text-slate-500">{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
