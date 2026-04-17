import { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Download,
  GitCompareArrows,
  Plus,
  X,
  Edit2,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from '@/hooks/useAppointments';
import { PatientSearchInput } from '@/components/shared/PatientSearchInput';
import { PatientDetailModal } from '@/components/shared/PatientDetailModal';
import { useCreatePatient } from '@/hooks/usePatients';
import { useDoctors } from '@/hooks/useStaff';
import { useServices } from '@/hooks/useServices';
import { exportToCsv } from '@/lib/exportCsv';
import { useT, getStatusLabel } from '@/lib/translations';
import { useHistoryStore } from '@/store/historyStore';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/types/supabase';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

const STATUSES = [
  'SCHEDULED',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;
type ApptStatus = (typeof STATUSES)[number];

const STATUS_CLS: Record<string, string> = {
  SCHEDULED: 'ds-badge ds-badge-p',
  ARRIVED: 'ds-badge ds-badge-a',
  IN_PROGRESS: 'ds-badge ds-badge-warn',
  COMPLETED: 'ds-badge ds-badge-ok',
  CANCELLED: 'ds-badge ds-badge-err',
  NO_SHOW: 'ds-badge ds-badge-neutral',
};

const DOCTOR_COLORS = [
  'linear-gradient(135deg,#6D28D9,#8B5CF6)',
  'linear-gradient(135deg,#0891B2,#06B6D4)',
  'linear-gradient(135deg,#059669,#10B981)',
  'linear-gradient(135deg,#D97706,#F59E0B)',
  'linear-gradient(135deg,#DC2626,#EF4444)',
];

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({
  appointmentId,
  current,
  isAr,
  onUpdate,
}: {
  appointmentId: string;
  current: string;
  isAr: boolean;
  onUpdate: (id: string, s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
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
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
        }}
      >
        {getStatusLabel(current, isAr)}
        <ChevronDown style={{ width: 11, height: 11 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 4px)',
            zIndex: 40,
            minWidth: 160,
            borderRadius: 10,
            border: '1px solid var(--brd)',
            background: 'var(--bg2)',
            boxShadow: 'var(--shadow)',
            padding: '4px 0',
          }}
        >
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                onUpdate(appointmentId, s);
                setOpen(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                color: current === s ? 'var(--p2)' : 'var(--txt2)',
                background: current === s ? 'var(--p-ultra)' : 'transparent',
                border: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  'var(--p-ultra)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  current === s ? 'var(--p-ultra)' : 'transparent';
              }}
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

// ─── Appointment Modal ────────────────────────────────────────────────────────

interface ApptModalProps {
  appointment:
    | (Appointment & {
        patient?: { first_name: string; last_name: string } | null;
      })
    | null;
  isAr: boolean;
  onClose: () => void;
}

function AppointmentModal({ appointment, isAr, onClose }: ApptModalProps) {
  const t = useT(isAr);
  const isEdit = !!appointment;
  const [apptType, setApptType] = useState<'patient' | 'walkin'>(
    appointment?.patient_id ? 'patient' : 'walkin'
  );

  const startDt = appointment?.start_time
    ? new Date(appointment.start_time)
    : null;

  const [form, setForm] = useState({
    patient_id: appointment?.patient_id ?? '',
    walk_in_name: appointment?.walk_in_name ?? '',
    walk_in_phone: appointment?.walk_in_phone ?? '',
    doctor_ref_id:
      (appointment as (Appointment & { doctor_ref_id?: string | null }) | null)
        ?.doctor_ref_id ??
      appointment?.doctor_id ??
      '',
    service_id: appointment?.service_id ?? '',
    date: startDt
      ? startDt.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    time: startDt ? startDt.toTimeString().slice(0, 5) : '09:00',
    status: (appointment?.status ?? 'SCHEDULED') as ApptStatus,
    notes: appointment?.notes ?? '',
  });
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    patient?: string;
    walkin?: string;
    date?: string;
    time?: string;
  }>({});

  const { data: doctors = [] } = useDoctors();
  const { data: services = [] } = useServices();

  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const createPatient = useCreatePatient();
  const isPending =
    create.isPending || update.isPending || createPatient.isPending;

  const handleQuickCreatePatient = async (input: {
    first_name: string;
    last_name: string;
    phone?: string;
  }) => {
    setSubmitError('');
    setFieldErrors((prev) => ({ ...prev, patient: undefined }));
    try {
      const created = await createPatient.mutateAsync({
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim() || '-',
        phone: input.phone?.trim() || null,
      } as { first_name: string; last_name: string; phone: string | null });
      setForm((f) => ({ ...f, patient_id: created.id }));
      setApptType('patient');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : ((err as { message?: string })?.message ??
            (isAr ? 'تعذر إنشاء المريض.' : 'Failed to create patient.'));
      setSubmitError(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setFieldErrors({});

    const nextErrors: {
      patient?: string;
      walkin?: string;
      date?: string;
      time?: string;
    } = {};
    if (apptType === 'patient' && !form.patient_id)
      nextErrors.patient = isAr
        ? 'اختر مريضًا أو أنشئ مريضًا جديدًا.'
        : 'Select a patient or create a new one.';
    if (apptType === 'walkin' && !form.walk_in_name.trim())
      nextErrors.walkin = isAr
        ? 'الرجاء إدخال اسم الزائر.'
        : 'Please enter the walk-in name.';
    if (!form.date)
      nextErrors.date = isAr ? 'الرجاء اختيار تاريخ.' : 'Please select a date.';
    if (!form.time)
      nextErrors.time = isAr ? 'الرجاء اختيار وقت.' : 'Please select a time.';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const startDtObj = new Date(`${form.date}T${form.time}:00`);
    const startTime = startDtObj.toISOString();
    const endTime = new Date(
      startDtObj.getTime() + 30 * 60 * 1000
    ).toISOString();

    // Auto-create a patient record from walk-in data (new appointments only).
    // Split the walk_in_name into first + last. If only one word, last = '-'.
    let resolvedPatientId: string | null =
      apptType === 'patient' ? form.patient_id || null : null;

    try {
      if (apptType === 'walkin' && !isEdit) {
        const nameParts = form.walk_in_name.trim().split(/\s+/);
        const firstName = nameParts[0] ?? form.walk_in_name.trim();
        const lastName = nameParts.slice(1).join(' ') || '-';

        const newPatient = await createPatient.mutateAsync({
          first_name: firstName,
          last_name: lastName,
          phone: form.walk_in_phone.trim() || null,
        } as { first_name: string; last_name: string; phone: string | null });

        resolvedPatientId = newPatient.id;
      }

      const payload: Partial<AppointmentInsert> = {
        // Link to the auto-created (or selected) patient
        patient_id: resolvedPatientId,
        // Keep walk_in fields on edit so existing data isn't lost;
        // clear them on new appointments since patient record now exists.
        walk_in_name: isEdit && apptType === 'walkin'
          ? form.walk_in_name.trim() || null
          : null,
        walk_in_phone: isEdit && apptType === 'walkin'
          ? form.walk_in_phone.trim() || null
          : null,
        doctor_ref_id: form.doctor_ref_id || null,
        service_id: form.service_id || null,
        start_time: startTime,
        end_time: endTime,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (isEdit && appointment) {
        await update.mutateAsync({ id: appointment.id, values: payload });
      } else {
        await create.mutateAsync(
          payload as Omit<AppointmentInsert, 'clinic_id' | 'created_by'>
        );
      }
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : ((err as { message?: string })?.message ?? 'An error occurred.');
      setSubmitError(msg);
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 520 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {isEdit ? t.editAppointment : t.addAppointment}
          </span>
          <button className="ds-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Type toggle */}
          <div>
            <label className="ds-label">
              {isAr ? 'نوع الموعد' : 'Appointment Type'}
            </label>
            <div
              style={{
                display: 'flex',
                borderRadius: 10,
                border: '1px solid var(--brd)',
                overflow: 'hidden',
              }}
            >
              {(['patient', 'walkin'] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setApptType(tp)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: apptType === tp ? 'var(--p2)' : 'transparent',
                    color: apptType === tp ? '#fff' : 'var(--txt2)',
                  }}
                >
                  {tp === 'patient'
                    ? isAr
                      ? 'مريض مسجل'
                      : 'Registered Patient'
                    : isAr
                      ? 'زيارة مباشرة'
                      : 'Walk-in'}
                </button>
              ))}
            </div>
          </div>

          {/* Patient / Walk-in fields */}
          {apptType === 'patient' ? (
            <div>
              <label className="ds-label">{t.patient}</label>
              <PatientSearchInput
                value={form.patient_id ?? ''}
                onChange={(id) => {
                  setForm((f) => ({ ...f, patient_id: id }));
                  setFieldErrors((prev) => ({ ...prev, patient: undefined }));
                }}
                isAr={isAr}
                onQuickCreate={handleQuickCreatePatient}
                quickCreateLoading={createPatient.isPending}
              />
              {fieldErrors.patient && (
                <p className="ds-error" style={{ marginTop: 6 }}>
                  {fieldErrors.patient}
                </p>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div>
                <label className="ds-label">
                  {isAr ? 'اسم الزائر *' : 'Walk-in Name *'}
                </label>
                <input
                  required
                  className="ds-input"
                  value={form.walk_in_name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, walk_in_name: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, walkin: undefined }));
                  }}
                  placeholder={isAr ? 'الاسم الكامل' : 'Full name'}
                />
                {fieldErrors.walkin && (
                  <p className="ds-error" style={{ marginTop: 6 }}>
                    {fieldErrors.walkin}
                  </p>
                )}
              </div>
              <div>
                <label className="ds-label">
                  {isAr ? 'هاتف الزائر' : 'Walk-in Phone'}
                </label>
                <input
                  type="tel"
                  className="ds-input"
                  value={form.walk_in_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, walk_in_phone: e.target.value }))
                  }
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>
          )}

          {/* Doctor & Service */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div>
              <label className="ds-label">{t.doctor}</label>
              <select
                className="ds-input"
                value={form.doctor_ref_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, doctor_ref_id: e.target.value }))
                }
              >
                <option value="">
                  {isAr ? '— بدون طبيب —' : '— No doctor assigned —'}
                </option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
              {doctors.length === 0 && (
                <p style={{ fontSize: 11, color: 'var(--warn)', marginTop: 4 }}>
                  {isAr
                    ? 'لا يوجد أطباء. أضف من صفحة الفريق.'
                    : 'No doctors found. Add in Staff page.'}
                </p>
              )}
            </div>
            <div>
              <label className="ds-label">{t.service}</label>
              <select
                className="ds-input"
                value={form.service_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, service_id: e.target.value }))
                }
              >
                <option value="">{t.selectService}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {services.length === 0 && (
                <p style={{ fontSize: 11, color: 'var(--warn)', marginTop: 4 }}>
                  {isAr
                    ? 'لا توجد خدمات. أضف من صفحة الخدمات.'
                    : 'No services found. Add in Services page.'}
                </p>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div>
              <label className="ds-label">{t.date} *</label>
              <input
                required
                type="date"
                className="ds-input"
                value={form.date}
                onChange={(e) => {
                  setForm((f) => ({ ...f, date: e.target.value }));
                  setFieldErrors((prev) => ({ ...prev, date: undefined }));
                }}
              />
              {fieldErrors.date && (
                <p className="ds-error" style={{ marginTop: 6 }}>
                  {fieldErrors.date}
                </p>
              )}
            </div>
            <div>
              <label className="ds-label">{t.time} *</label>
              <input
                required
                type="time"
                className="ds-input"
                value={form.time}
                onChange={(e) => {
                  setForm((f) => ({ ...f, time: e.target.value }));
                  setFieldErrors((prev) => ({ ...prev, time: undefined }));
                }}
              />
              {fieldErrors.time && (
                <p className="ds-error" style={{ marginTop: 6 }}>
                  {fieldErrors.time}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="ds-label">{t.status}</label>
            <select
              className="ds-input"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as ApptStatus }))
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {getStatusLabel(s, isAr)}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="ds-label">{t.notes}</label>
            <textarea
              className="ds-input"
              style={{ resize: 'none' }}
              rows={2}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder={
                isAr ? 'ملاحظات إضافية...' : 'Any additional notes...'
              }
            />
          </div>

          {submitError && <p className="ds-error">{submitError}</p>}

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={isPending}
              className="ds-btn ds-btn-primary"
              style={{ flex: 1 }}
            >
              {isPending
                ? isAr
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : isEdit
                  ? t.save
                  : isAr
                    ? 'حجز الموعد'
                    : 'Book Appointment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ds-btn ds-btn-ghost"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Compare Days View ────────────────────────────────────────────────────────

function CompareDaysView({ isAr }: { isAr: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const [dateA, setDateA] = useState(today);
  const [dateB, setDateB] = useState(today);
  const { data: allAppointments = [] } = useAppointments();

  const filterByDate = (date: string) =>
    allAppointments
      .filter((a) => a.start_time.slice(0, 10) === date)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const apptA = filterByDate(dateA);
  const apptB = filterByDate(dateB);

  const DayColumn = ({
    date,
    setDate,
    appts,
    label,
  }: {
    date: string;
    setDate: (d: string) => void;
    appts: typeof allAppointments;
    label: string;
  }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--txt3)',
          }}
        >
          {label}
        </span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="ds-input"
          style={{ flex: 1 }}
        />
      </div>
      <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
        {appts.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--txt3)',
            }}
          >
            {isAr
              ? 'لا توجد مواعيد في هذا اليوم.'
              : 'No appointments on this day.'}
          </div>
        ) : (
          <div>
            {appts.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom:
                    i < appts.length - 1 ? '1px solid var(--brd)' : 'none',
                }}
              >
                <div style={{ width: 52, flexShrink: 0, textAlign: 'center' }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--p2)',
                    }}
                  >
                    {new Date(a.start_time).toLocaleTimeString('en-EG', {
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--txt)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {a.patient
                      ? `${a.patient.first_name} ${a.patient.last_name}`
                      : (a.walk_in_name ?? '—')}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                    {a.service?.name ?? (isAr ? 'بدون خدمة' : 'No service')}
                  </p>
                </div>
                <span
                  className={
                    STATUS_CLS[a.status ?? 'SCHEDULED'] ?? STATUS_CLS.SCHEDULED
                  }
                >
                  {getStatusLabel(a.status ?? 'SCHEDULED', isAr)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p style={{ textAlign: 'right', fontSize: 11, color: 'var(--txt3)' }}>
        {appts.length}{' '}
        {isAr ? 'موعد' : `appointment${appts.length !== 1 ? 's' : ''}`}
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <DayColumn
        date={dateA}
        setDate={setDateA}
        appts={apptA}
        label={isAr ? 'اليوم أ' : 'Day A'}
      />
      <div
        style={{ width: 1, alignSelf: 'stretch', background: 'var(--brd)' }}
      />
      <DayColumn
        date={dateB}
        setDate={setDateB}
        appts={apptB}
        label={isAr ? 'اليوم ب' : 'Day B'}
      />
    </div>
  );
}

// ─── Today's Doctor Grid ──────────────────────────────────────────────────────

type RichAppt = Appointment & {
  doctor_ref_id?: string | null;
  patient?: { first_name: string; last_name: string } | null;
  doctor?: { full_name: string } | null;
  doctor_ref?: { full_name: string } | null;
  service?: { name: string } | null;
  walk_in_name?: string | null;
};

function TodayDoctorGrid({
  appointments,
  isAr,
}: {
  appointments: RichAppt[];
  isAr: boolean;
}) {
  const t = useT(isAr);
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(
    (a) => a.start_time.slice(0, 10) === today
  );

  if (todayAppts.length === 0) return null;

  const grouped = new Map<
    string,
    { doctorName: string; appts: typeof todayAppts; colorIdx: number }
  >();
  let colorIdx = 0;
  for (const a of todayAppts) {
    const key = a.doctor_ref_id ?? a.doctor_id ?? 'unassigned';
    const doctorName =
      a.doctor_ref?.full_name ??
      a.doctor?.full_name ??
      (isAr ? 'غير محدد' : 'Unassigned');
    if (!grouped.has(key)) {
      grouped.set(key, {
        doctorName,
        appts: [],
        colorIdx: colorIdx++ % DOCTOR_COLORS.length,
      });
    }
    grouped.get(key)!.appts.push(a);
  }
  const groups = Array.from(grouped.values()).sort((a, b) =>
    a.doctorName.localeCompare(b.doctorName)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--txt)',
            margin: 0,
          }}
        >
          {t.todaySchedule}
        </h2>
        <span style={{ fontSize: 11, color: 'var(--txt3)' }}>
          {new Date().toLocaleDateString('en-EG', { dateStyle: 'full' })}
        </span>
        <span className="ds-badge ds-badge-p" style={{ marginLeft: 4 }}>
          {todayAppts.length} {t.appts}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}
      >
        {groups.map(({ doctorName, appts, colorIdx: ci }) => (
          <div
            key={doctorName}
            className="ds-card"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid var(--brd)',
                background: 'var(--p-ultra)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="ds-avatar"
                  style={{
                    width: 34,
                    height: 34,
                    fontSize: 13,
                    flexShrink: 0,
                    background: DOCTOR_COLORS[ci],
                  }}
                >
                  {doctorName.charAt(0)}
                </div>
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}
                >
                  {doctorName}
                </span>
              </div>
              <span className="ds-badge ds-badge-p">{appts.length}</span>
            </div>
            <div>
              {appts
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((a, i) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      borderBottom:
                        i < appts.length - 1 ? '1px solid var(--brd)' : 'none',
                    }}
                  >
                    <span
                      style={{
                        width: 46,
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--p2)',
                      }}
                    >
                      {new Date(a.start_time).toLocaleTimeString('en-EG', {
                        timeStyle: 'short',
                      })}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--txt)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {a.patient
                          ? `${a.patient.first_name} ${a.patient.last_name}`
                          : (a.walk_in_name ?? '—')}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--txt3)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.service?.name ?? (isAr ? 'بدون خدمة' : 'No service')}
                      </p>
                    </div>
                    <span
                      className={
                        STATUS_CLS[a.status ?? 'SCHEDULED'] ??
                        STATUS_CLS.SCHEDULED
                      }
                      style={{ flexShrink: 0 }}
                    >
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AppointmentsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [compareMode, setCompareMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<
    | (Appointment & {
        patient?: { first_name: string; last_name: string } | null;
      })
    | null
  >(null);
  const [detailPatient, setDetailPatient] = useState<{ id: string; [key: string]: unknown } | null>(null);

  const [filterDate, setFilterDate] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: doctors = [] } = useDoctors();
  const {
    data: allAppointments = [],
    isLoading,
    error,
  } = useAppointments({
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

  const errorMessage =
    error instanceof Error
      ? error.message
      : isAr
        ? 'فشل تحميل المواعيد.'
        : 'Failed to load appointments.';

  const handleStatusChange = (id: string, newStatus: string) => {
    const appt = allAppointments.find((a) => a.id === id);
    const oldStatus = (appt?.status ?? 'SCHEDULED') as ApptStatus;
    updateAppt.mutate({ id, values: { status: newStatus as ApptStatus } });
    pushAction({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: `Changed appointment status to ${newStatus}`,
      description_ar: `تغيير حالة الموعد إلى ${newStatus}`,
      undo: async () => {
        await updateAppt.mutateAsync({ id, values: { status: oldStatus } });
      },
      redo: async () => {
        await updateAppt.mutateAsync({
          id,
          values: { status: newStatus as ApptStatus },
        });
      },
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
      undo: async () => {
        await updateAppt.mutateAsync({
          id: a.id,
          values: { deleted_at: null } as any,
        });
      },
      redo: async () => {
        await deleteAppt.mutateAsync(a.id);
      },
    });
  };

  const handleExport = () => {
    exportToCsv(
      'appointments',
      appointments.map((a) => ({
        Patient: a.patient
          ? `${a.patient.first_name} ${a.patient.last_name}`
          : (a.walk_in_name ?? ''),
        'Walk-in Phone': a.walk_in_phone ?? '',
        Service: a.service?.name ?? '',
        'Start Time': a.start_time,
        Status: a.status ?? '',
      }))
    );
  };

  const openAdd = () => {
    setEditingAppt(null);
    setModalOpen(true);
  };
  const openEdit = (a: (typeof appointments)[number]) => {
    setEditingAppt(a);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingAppt(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            className="ds-badge ds-badge-p"
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            {appointments.length} {isAr ? 'موعد' : 'appointments'}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleExport}
            className="ds-btn ds-btn-ghost"
            style={{ gap: 6 }}
          >
            <Download size={14} /> {isAr ? 'تصدير CSV' : 'Export CSV'}
          </button>
          <button
            onClick={() => setCompareMode((m) => !m)}
            className="ds-btn ds-btn-ghost"
            style={{
              gap: 6,
              background: compareMode ? 'var(--p-soft)' : undefined,
              color: compareMode ? 'var(--p2)' : undefined,
              borderColor: compareMode ? 'var(--p3)' : undefined,
            }}
          >
            <GitCompareArrows size={14} /> {t.compareView}
          </button>
          <button
            onClick={openAdd}
            className="ds-btn ds-btn-primary"
            style={{ gap: 6 }}
          >
            <Plus size={14} strokeWidth={2.5} /> {t.addAppointment}
          </button>
        </div>

        {/* Filter bar */}
        {!compareMode && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--brd)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="ds-input"
              style={{ width: 160 }}
            />
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="ds-input"
              style={{ minWidth: 160 }}
            >
              <option value="">{isAr ? 'كل الأطباء' : 'All Doctors'}</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="ds-input"
              style={{ minWidth: 150 }}
            >
              <option value="">{t.allStatuses}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {getStatusLabel(s, isAr)}
                </option>
              ))}
            </select>
            {(filterDate || filterDoctor || filterStatus) && (
              <button
                onClick={() => {
                  setFilterDate('');
                  setFilterDoctor('');
                  setFilterStatus('');
                }}
                className="ds-btn ds-btn-ghost"
                style={{
                  color: 'var(--err)',
                  borderColor: 'var(--err-soft)',
                  gap: 4,
                  padding: '6px 12px',
                }}
              >
                <X size={13} /> {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Today's Doctor Grid */}
      {!compareMode &&
        !filterDate &&
        !filterDoctor &&
        !filterStatus &&
        !isLoading && (
          <TodayDoctorGrid appointments={allAppointments} isAr={isAr} />
        )}

      {/* Main content */}
      {compareMode ? (
        <CompareDaysView isAr={isAr} />
      ) : isLoading ? (
        <div
          className="ds-card"
          style={{
            padding: '60px 0',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div className="ds-spinner" />
        </div>
      ) : error ? (
        <div
          className="ds-card"
          style={{
            padding: 18,
            background: 'var(--err-soft)',
            border: '1px solid var(--err)',
            color: 'var(--err)',
          }}
        >
          {errorMessage}
        </div>
      ) : appointments.length === 0 ? (
        <div className="ds-empty">
          <Calendar
            size={40}
            style={{ color: 'var(--txt3)', marginBottom: 12 }}
          />
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--txt)',
              marginBottom: 6,
            }}
          >
            {t.noAppointmentsFound}
          </p>
          <p style={{ fontSize: 13, color: 'var(--txt3)', marginBottom: 16 }}>
            {t.addFirstAppointment}
          </p>
          <button
            onClick={openAdd}
            className="ds-btn ds-btn-primary"
            style={{ gap: 6 }}
          >
            <Plus size={14} strokeWidth={2.5} /> {t.addAppointment}
          </button>
        </div>
      ) : (
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th className="ds-th">{t.patient}</th>
                <th className="ds-th">
                  {t.date} / {t.time}
                </th>
                <th className="ds-th">{t.service}</th>
                <th className="ds-th">{t.status}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>
                  {t.actions}
                </th>
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div
                          className="ds-avatar"
                          style={{
                            width: 36,
                            height: 36,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          {a.patient ? (
                            <button
                              onClick={() => setDetailPatient(a.patient as typeof detailPatient)}
                              style={{
                                fontSize: 13, fontWeight: 600, color: 'var(--p2)',
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                              }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
                            >
                              {`${a.patient.first_name} ${a.patient.last_name}`}
                            </button>
                          ) : (
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
                              {a.walk_in_name ?? '—'}
                            </p>
                          )}
                          <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                            {a.patient
                              ? isAr
                                ? 'مريض'
                                : 'Patient'
                              : isAr
                                ? 'زيارة مباشرة'
                                : 'Walk-in'}
                            {a.walk_in_phone ? ` · ${a.walk_in_phone}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="ds-td">
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--txt)',
                        }}
                      >
                        {new Date(a.start_time).toLocaleDateString('en-EG', {
                          dateStyle: 'medium',
                        })}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                        {new Date(a.start_time).toLocaleTimeString('en-EG', {
                          timeStyle: 'short',
                        })}
                      </p>
                    </td>
                    <td
                      className="ds-td"
                      style={{ color: 'var(--txt2)', fontSize: 13 }}
                    >
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 4,
                        }}
                      >
                        <button
                          data-testid={`appointment-edit-${a.id}`}
                          onClick={() => openEdit(a)}
                          className="ds-icon-btn"
                          title={isAr ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 size={14} />
                        </button>
                        {can('delete:appointment') && (
                          <button
                            data-testid={`appointment-delete-${a.id}`}
                            onClick={() => handleDelete(a)}
                            className="ds-icon-btn-err"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
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
      )}

      {modalOpen && (
        <AppointmentModal
          appointment={editingAppt}
          isAr={isAr}
          onClose={closeModal}
        />
      )}
      <PatientDetailModal
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
      />
    </div>
  );
}
