import type { Database } from '@/types/supabase';

type InvoiceStatus = Database['public']['Tables']['invoices']['Insert']['status'];

export function deriveInvoiceStatus(total: number, balance: number): InvoiceStatus {
  if (balance <= 0) return 'PAID';
  if (balance >= total) return 'UNPAID';
  return 'PARTIALLY_PAID';
}

export function validateInvoiceStatusBalance(
  status: string,
  total: number,
  balance: number,
  isAr: boolean
): string | null {
  if (isNaN(total) || total <= 0)
    return isAr ? 'يجب أن يكون الإجمالي أكبر من 0.' : 'Total amount must be greater than 0.';
  if (isNaN(balance) || balance < 0 || balance > total)
    return isAr ? 'الرصيد المستحق يجب أن يكون بين 0 والإجمالي.' : 'Balance due must be between 0 and total.';
  if (status === 'PAID' && balance > 0)
    return isAr ? 'الفاتورة المدفوعة يجب أن يكون رصيدها 0.' : 'PAID invoice must have zero balance.';
  if ((status === 'UNPAID' || status === 'DRAFT') && balance < total)
    return isAr ? 'الفاتورة غير المدفوعة/المسودة يجب أن يبقى رصيدها كاملًا.' : 'UNPAID/DRAFT invoice must keep full balance.';
  if (status === 'PARTIALLY_PAID' && (balance <= 0 || balance >= total))
    return isAr ? 'الفاتورة المدفوعة جزئيًا يجب أن يكون رصيدها بين 0 والإجمالي.' : 'PARTIALLY_PAID invoice must have balance between 0 and total.';
  if (status === 'CANCELLED' && balance !== total)
    return isAr ? 'الفاتورة الملغاة يجب أن تحتفظ بكامل الرصيد.' : 'CANCELLED invoice must keep full balance.';
  return null;
}
