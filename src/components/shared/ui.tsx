/**
 * Shared UI primitives — use these everywhere instead of inline styles.
 * Keeps the whole app consistent and easy to update in one place.
 */
import type { ReactNode } from 'react';

// ─── Page Header ─────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12, marginBottom: 24,
    }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt)', lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--txt3)', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '64px 24px', gap: 12, textAlign: 'center',
    }}>
      {icon && <div style={{ fontSize: 40, marginBottom: 4, opacity: 0.4 }}>{icon}</div>}
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt2)' }}>{title}</p>
      {description && <p style={{ fontSize: 13, color: 'var(--txt3)', maxWidth: 320 }}>{description}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function LoadingSpinner({ fullPage = false }: { fullPage?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...(fullPage ? { height: '100vh' } : { padding: '64px 24px' }),
    }}>
      <div className="ds-spinner" />
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '64px 24px', gap: 12, textAlign: 'center',
    }}>
      <span style={{ fontSize: 36 }}>⚠️</span>
      <p style={{ fontSize: 14, color: 'var(--err)', fontWeight: 600 }}>{message}</p>
      {onRetry && (
        <button className="ds-btn-secondary" onClick={onRetry} style={{ marginTop: 4 }}>
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  sub?: string;
}
export function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <div className="ds-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 12, color: 'var(--txt3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 900, color: color ?? 'var(--txt)', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>{sub}</p>}
      </div>
      {icon && <div style={{ opacity: 0.5, fontSize: 22 }}>{icon}</div>}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'ok' | 'warn' | 'err' | 'info' | 'neutral';
const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  ok:      { bg: 'var(--ok-soft)',   color: 'var(--ok)' },
  warn:    { bg: 'var(--warn-soft)', color: 'var(--warn)' },
  err:     { bg: 'var(--err-soft)',  color: 'var(--err)' },
  info:    { bg: 'var(--p-soft)',    color: 'var(--p2)' },
  neutral: { bg: 'var(--bg3)',       color: 'var(--txt3)' },
};
export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: BadgeVariant }) {
  const s = BADGE_STYLES[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color,
    }}>{children}</span>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--brd)', margin: '16px 0' }} />;
}

// ─── Mobile-friendly Table Wrapper ───────────────────────────────────────────
export function TableWrapper({ children }: { children: ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 12 }}>
      {children}
    </div>
  );
}
