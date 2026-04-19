import { useState } from 'react';
import { Calendar, Download, GitCompareArrows, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppointments, useUpdateAppointment, useDeleteAppointment } from '@/hooks/useAppointments';
import { PatientDetailModal } from '@/components/shared/PatientDetailModal';
import { useDoctors } from '@/hooks/useStaff';
import { exportToCsv } from '@/lib/exportCsv';
import { useT, getStatusLabel } from '@/lib/translations';
import { useHistoryStore } from '@/store/historyStore';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/types/supabase';

import { StatusDropdown } from '../components/StatusDropdown';
import { AppointmentModal } from '../components/AppointmentModal';
import { CompareDaysView } from '../components/CompareDaysView';
import { TodayDoctorGrid } from '../components/TodayDoctorGrid';
import type { RichAppt } from '../components/TodayDoctorGrid';

type Appointment = Database['public']['Tables']['appointments']['Row'];

const STATUSES = [
  'SCHEDULED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW',
] as const;

export function AppointmentsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [compareMode, setCompareMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<
    (Appointment & { patient?: { first_name: string; last_name: string } | null }) | null
  >(null);
  const [detailPatient, setDetailPatient] = useState<{ id: string; [key: string]: unknown } | null>(null);

  const [filterDate, setFilterDate] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: doctors = [] } = useDoctors();
  const { data: allAppointments = [], isLoading, error } = useAppointments({
    doctorId: filterDoctor || undefined,
    status: filterStatus || undefined,
  });

  const appointments = filterDate
    ? allAppointments.filter((a) => a.start_time.slice(0, 10) === filterDate)
    : allAppointments;

  const updateAppt = useUpdateAppointment();
  const deleteAppt = useDeleteAppointment();
  const { pushAction } = useHistoryStore();
  const { can } = usePermissions();

  const errorMessage = error instanceof Error ? error.message : (isAr ? 'فشل تحميل المواعيد.' : 'Failed to load appointments.');

  const handleStatusChange = (id: string, newStatus: string) => {
    const appt = allAppointments.find((a) => a.id === id);
    const oldStatus = (appt?.status ?? 'SCHEDULED') as (typeof STATUSES)[number];
    updateAppt.mutate({ id, values: { status: newStatus as typeof oldStatus } });
    pushAction({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: `Changed appointment status to ${newStatus}`,
      description_ar: `تغيير حالة الموعد إلى ${newStatus}`,
      undo: async () => { await updateAppt.mutateAsync({ id, values: { status: oldStatus } }); },
      redo: async () => { await updateAppt.mutateAsync({ id, values: { status: newStatus as typeof oldStatus } }); },
    });
  };

  const handleDelete = async (a: Appointment) => {
    if (!confirm(isAr ? 'حذف هذا الموعد؟' : 'Delete this appointment?')) return;
    const patientName = (a as RichAppt).patient
      ? `${(a as RichAppt).patient!.first_name} ${(a as RichAppt).patient!.last_name}`
      : (a.walk_in_name ?? '—');
    await deleteAppt.mutateAsync(a.id);
    pushAction({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: `Deleted appointment: ${patientName}`,
      description_ar: `حُذف موعد: ${patientName}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      undo: async () => { await updateAppt.mutateAsync({ id: a.id, values: { deleted_at: null } as any }); },
      redo: async () => { await deleteAppt.mutateAsync(a.id); },
    });
  };

  const handleExport = () => {
    exportToCsv('appointments', appointments.map((a) => ({
      Patient: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : (a.walk_in_name ?? ''),
      'Walk-in Phone': a.walk_in_phone ?? '',
      Service: a.service?.name ?? '',
      'Start Time': a.start_time,
      Status: a.status ?? '',
    })));
  };

  const openAdd = () => { setEditingAppt(null); setModalOpen(true); };
  const openEdit = (a: (typeof appointments)[number]) => { setEditingAppt(a); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingAppt(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span className="ds-badge ds-badge-p" style={{ fontSize: 12, padding: '4px 10px' }}>
            {appointments.length} {isAr ? 'موعد' : 'appointments'}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={handleExport} className="ds-btn ds-btn-ghost" style={{ gap: 6 }}>
            <Download size={14} /> {isAr ? 'تصدير CSV' : 'Export CSV'}
          </button>
          <button
            onClick={() => setCompareMode((m) => !m)}
            className="ds-btn ds-btn-ghost"
            style={{ gap: 6, background: compareMode ? 'var(--p-soft)' : undefined, color: compareMode ? 'var(--p2)' : undefined, borderColor: compareMode ? 'var(--p3)' : undefined }}
          >
            <GitCompareArrows size={14} /> {t.compareView}
          </button>
          <button onClick={openAdd} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addAppointment}
          </button>
        </div>

        {/* Filter bar */}
        {!compareMode && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--brd)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="ds-input" style={{ width: 160 }} />
            <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className="ds-input" style={{ minWidth: 160 }}>
              <option value="">{isAr ? 'كل الأطباء' : 'All Doctors'}</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="ds-input" style={{ minWidth: 150 }}>
              <option value="">{t.allStatuses}</option>
              {STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s, isAr)}</option>)}
            </select>
            {(filterDate || filterDoctor || filterStatus) && (
              <button onClick={() => { setFilterDate(''); setFilterDoctor(''); setFilterStatus(''); }} className="ds-btn ds-btn-ghost" style={{ color: 'var(--err)', borderColor: 'var(--err-soft)', gap: 4, padding: '6px 12px' }}>
                <X size={13} /> {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Today's Doctor Grid */}
      {!compareMode && !filterDate && !filterDoctor && !filterStatus && !isLoading && (
        <TodayDoctorGrid appointments={allAppointments as RichAppt[]} isAr={isAr} />
      )}

      {/* Main content */}
      {compareMode ? (
        <CompareDaysView isAr={isAr} />
      ) : isLoading ? (
        <div className="ds-card" style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : error ? (
        <div className="ds-card" style={{ padding: 18, background: 'var(--err-soft)', border: '1px solid var(--err)', color: 'var(--err)' }}>
          {errorMessage}
        </div>
      ) : appointments.length === 0 ? (
        <div className="ds-empty">
          <Calendar size={40} style={{ color: 'var(--txt3)', marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>{t.noAppointmentsFound}</p>
          <p style={{ fontSize: 13, color: 'var(--txt3)', marginBottom: 16 }}>{t.addFirstAppointment}</p>
          <button onClick={openAdd} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addAppointment}
          </button>
        </div>
      ) : (
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th className="ds-th">{t.patient}</th>
                  <th className="ds-th">{t.date} / {t.time}</th>
                  <th className="ds-th mobile-hide">{t.service}</th>
                  <th className="ds-th">{t.status}</th>
                  <th className="ds-th" style={{ textAlign: 'right' }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const initials = a.patient
                    ? `${a.patient.first_name.charAt(0)}${a.patient.last_name.charAt(0)}`
                    : (a.walk_in_name ?? 'W').slice(0, 2).toUpperCase();
                  return (
                    <tr key={a.id} className="ds-tbody-row">
                      <td className="ds-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="ds-avatar" style={{ width: 36, height: 36, fontSize: 12, flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div>
                            {a.patient ? (
                              <button
                                onClick={() => setDetailPatient(a.patient as typeof detailPatient)}
                                style={{ fontSize: 13, fontWeight: 600, color: 'var(--p2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
                              >
                                {`${a.patient.first_name} ${a.patient.last_name}`}
                              </button>
                            ) : (
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{a.walk_in_name ?? '—'}</p>
                            )}
                            <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                              {a.patient ? (isAr ? 'مريض' : 'Patient') : (isAr ? 'زيارة مباشرة' : 'Walk-in')}
                              {a.walk_in_phone ? ` · ${a.walk_in_phone}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="ds-td">
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
                          {new Date(a.start_time).toLocaleDateString('en-EG', { dateStyle: 'medium' })}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                          {new Date(a.start_time).toLocaleTimeString('en-EG', { timeStyle: 'short' })}
                        </p>
                      </td>
                      <td className="ds-td mobile-hide" style={{ color: 'var(--txt2)', fontSize: 13 }}>
                        {a.service?.name ?? '—'}
                      </td>
                      <td className="ds-td">
                        <StatusDropdown
                          appointmentId={a.id}
                          current={a.status ?? 'SCHEDULED'}
                          isAr={isAr}
                          onUpdate={handleStatusChange}
                        />
                      </td>
                      <td className="ds-td">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <button data-testid={`appointment-edit-${a.id}`} onClick={() => openEdit(a)} className="ds-icon-btn" title={isAr ? 'تعديل' : 'Edit'}>
                            <Edit2 size={14} />
                          </button>
                          {can('delete:appointment') && (
                            <button data-testid={`appointment-delete-${a.id}`} onClick={() => handleDelete(a)} className="ds-icon-btn-err" title={isAr ? 'حذف' : 'Delete'}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && <AppointmentModal appointment={editingAppt} isAr={isAr} onClose={closeModal} />}
      <PatientDetailModal patient={detailPatient} onClose={() => setDetailPatient(null)} />
    </div>
  );
}
