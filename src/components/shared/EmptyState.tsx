import type { ReactNode, ElementType } from 'react';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="ds-empty">
      {Icon && <Icon size={40} style={{ color: 'var(--txt3)', marginBottom: 12 }} />}
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: 13, color: 'var(--txt3)', marginBottom: action ? 16 : 0 }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
