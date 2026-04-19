import { useState } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { getStatusLabel } from '@/lib/translations';
import { STATUS_CLS } from './StatusDropdown';
import type { Database } from '@/types/supabase';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type RichAppt = Appointment & {
  patient?: { first_name: string; last_name: string } | null;
  service?: { name: string } | null;
};

interface Props {
  isAr: boolean;
}

export function CompareDaysView({ isAr }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [dateA, setDateA] = useState(today);
  const [dateB, setDateB] = useState(today);
  const { data: allAppointments = [] } = useAppointments();

  const filterByDate = (date: string) =>
    (allAppointments as RichAppt[])
      .filter((a) => a.start_time.slice(0, 10) === date)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const apptA = filterByDate(dateA);
  const apptB = filterByDate(dateB);

  function DayColumn({
    date, setDate, appts, label,
  }: {
    date: string;
    setDate: (d: string) => void;
    appts: RichAppt[];
    label: string;
  }) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--txt3)' }}>
            {label}
          </span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ds-input" style={{ flex: 1 }} />
        </div>
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          {appts.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--txt3)' }}>
              {isAr ? 'لا توجد مواعيد في هذا اليوم.' : 'No appointments on this day.'}
            </div>
          ) : (
            <div>
              {appts.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < appts.length - 1 ? '1px solid var(--brd)' : 'none' }}>
                  <div style={{ width: 52, flexShrink: 0, textAlign: 'center' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--p2)' }}>
                      {new Date(a.start_time).toLocaleTimeString('en-EG', { timeStyle: 'short' })}
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : (a.walk_in_name ?? '—')}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                      {a.service?.name ?? (isAr ? 'بدون خدمة' : 'No service')}
                    </p>
                  </div>
                  <span className={STATUS_CLS[a.status ?? 'SCHEDULED'] ?? STATUS_CLS.SCHEDULED}>
                    {getStatusLabel(a.status ?? 'SCHEDULED', isAr)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p style={{ textAlign: 'right', fontSize: 11, color: 'var(--txt3)' }}>
          {appts.length} {isAr ? 'موعد' : `appointment${appts.length !== 1 ? 's' : ''}`}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <DayColumn date={dateA} setDate={setDateA} appts={apptA} label={isAr ? 'اليوم أ' : 'Day A'} />
      <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--brd)' }} />
      <DayColumn date={dateB} setDate={setDateB} appts={apptB} label={isAr ? 'اليوم ب' : 'Day B'} />
    </div>
  );
}
