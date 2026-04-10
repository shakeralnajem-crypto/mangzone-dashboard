/**
 * Format a number as Egyptian Pounds (EGP).
 * Examples:  1500 → "1,500 EGP"   |  0 → "0 EGP"
 */
export function formatEGP(amount: number | null | undefined): string {
  if (amount == null) return '— EGP';
  return (
    new Intl.NumberFormat('en-EG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount) + ' EGP'
  );
}
