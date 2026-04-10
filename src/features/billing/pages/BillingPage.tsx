import { ReceiptText } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { formatEGP } from '@/lib/currency';

export function BillingPage() {
  const { data: invoices = [], isLoading, error } = useInvoices();
  const errorMessage = error instanceof Error ? error.message : 'Failed to load invoices.';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {invoices.length} invoices
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </div>
      ) : invoices.length === 0 ? (
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
                <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Balance Due</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {inv.invoice_number || '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">
                    {formatEGP(inv.total_amount)}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${inv.balance_due > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {formatEGP(inv.balance_due)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {(inv.status ?? 'UNPAID').replace('_', ' ')}
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
