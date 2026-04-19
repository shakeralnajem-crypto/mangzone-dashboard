import type { ReactNode } from 'react';

interface PageHeaderProps {
  badge?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * Consistent toolbar header used at the top of every page.
 * Renders a badge (count / label) on the left, optional filter children
 * in the middle, and action buttons on the right.
 */
export function PageHeader({ badge, actions, children }: PageHeaderProps) {
  return (
    <div className="ds-card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        {badge && (
          <span className="ds-badge ds-badge-p" style={{ fontSize: 12, padding: '4px 10px' }}>
            {badge}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {actions}
      </div>
      {children && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--brd)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
