import { useT } from '@/lib/translations';
import { getStatusLabel } from '@/lib/translations';
import { STATUS_CLS } from './StatusDropdown';
import type { Database } from '@/types/supabase';

type Appointment = Database['public']['Tables']['appointments']['Row'];

export type RichAppt = Appointment & {
  doctor_ref_id?: string | null;
  patient?: { first_name: string; last_name: string } | null;
  doctor?: { full_name: string } | null;
  doctor_ref?: { full_name: string } | null;
  service?: { name: string } | null;
  walk_in_name?: string | null;
};

const DOCTOR_COLORS = [
  'linear-gradient(135deg,#6D28D9,#8B5CF6)',
  'linear-gradient(135deg,#0891B2,#06B6D4)',
  'linear-gradient(135deg,#059669,#10B981)',
  'linear-gradient(135deg,#D97706,#F59E0B)',
  'linear-gradient(135deg,#DC2626,#EF4444)',
];

interface Props {
  appointments: RichAppt[];
  isAr: boolean;
}

export function TodayDoctorGrid({ appointments, isAr }: Props) {
  const t = useT(isAr);
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.start_time.slice(0, 10) === today);

  if (todayAppts.length === 0) return null;

  const grouped = new Map<string, { doctorName: string; appts: typeof todayAppts; colorIdx: number }>();
  let colorIdx = 0;
  for (const a of todayAppts) {
    const key = a.doctor_ref_id ?? a.doctor_id ?? 'unassigned';
    const doctorName = a.doctor_ref?.full_name ?? a.doctor?.full_name ?? (isAr ? 'غير محدد' : 'Unassigned');
    if (!grouped.has(key)) {
      grouped.set(key, { doctorName, appts: [], colorIdx: colorIdx++ % DOCTOR_COLORS.length });
    }
    grouped.get(key)!.appts.push(a);
  }
  const groups = Array.from(grouped.values()).sort((a, b) => a.doctorName.localeCompare(b.doctorName));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>{t.todaySchedule}</h2>
        <span style={{ fontSize: 11, color: 'var(--txt3)' }}>
          {new Date().toLocaleDateString('en-EG', { dateStyle: 'full' })}
        </span>
        <span className="ds-badge ds-badge-p" style={{ marginLeft: 4 }}>
          {todayAppts.length} {t.appts}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {groups.map(({ doctorName, appts, colorIdx: ci }) => (
          <div key={doctorName} className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--brd)', background: 'var(--p-ultra)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ds-avatar" style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0, background: DOCTOR_COLORS[ci] }}>
                  {doctorName.charAt(0)}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{doctorName}</span>
              </div>
              <span className="ds-badge ds-badge-p">{appts.length}</span>
            </div>
            <div>
              {appts
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < appts.length - 1 ? '1px solid var(--brd)' : 'none' }}>
                    <span style={{ width: 46, flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--p2)' }}>
                      {new Date(a.start_time).toLocaleTimeString('en-EG', { timeStyle: 'short' })}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : (a.walk_in_name ?? '—')}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--txt3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.service?.name ?? (isAr ? 'بدون خدمة' : 'No service')}
                      </p>
                    </div>
                    <span className={STATUS_CLS[a.status ?? 'SCHEDULED'] ?? STATUS_CLS.SCHEDULED} style={{ flexShrink: 0 }}>
                      {getStatusLabel(a.status ?? 'SCHEDULED', isAr)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
