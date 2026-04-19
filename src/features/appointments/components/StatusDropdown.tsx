import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getStatusLabel } from '@/lib/translations';

const STATUSES = [
  'SCHEDULED',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export const STATUS_CLS: Record<string, string> = {
  SCHEDULED: 'ds-badge ds-badge-p',
  ARRIVED: 'ds-badge ds-badge-a',
  IN_PROGRESS: 'ds-badge ds-badge-warn',
  COMPLETED: 'ds-badge ds-badge-ok',
  CANCELLED: 'ds-badge ds-badge-err',
  NO_SHOW: 'ds-badge ds-badge-neutral',
};

interface Props {
  appointmentId: string;
  current: string;
  isAr: boolean;
  onUpdate: (id: string, status: string) => void;
}

export function StatusDropdown({ appointmentId, current, isAr, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cls = STATUS_CLS[current] ?? STATUS_CLS.SCHEDULED;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        data-testid={`appointment-status-${appointmentId}`}
        onClick={() => setOpen((v) => !v)}
        className={cls}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
      >
        {getStatusLabel(current, isAr)}
        <ChevronDown style={{ width: 11, height: 11 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', left: 0, top: 'calc(100% + 4px)', zIndex: 40,
          minWidth: 160, borderRadius: 10, border: '1px solid var(--brd)',
          background: 'var(--bg2)', boxShadow: 'var(--shadow)', padding: '4px 0',
        }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { onUpdate(appointmentId, s); setOpen(false); }}
              style={{
                width: '100%', textAlign: 'left', padding: '7px 14px',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                color: current === s ? 'var(--p2)' : 'var(--txt2)',
                background: current === s ? 'var(--p-ultra)' : 'transparent',
                border: 'none', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--p-ultra)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = current === s ? 'var(--p-ultra)' : 'transparent'; }}
            >
              <span className={STATUS_CLS[s]} style={{ pointerEvents: 'none' }}>
                {getStatusLabel(s, isAr)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
