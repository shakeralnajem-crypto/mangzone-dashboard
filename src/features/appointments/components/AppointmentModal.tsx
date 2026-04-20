import { useState } from 'react';
import { X } from 'lucide-react';
import {
  useCreateAppointment,
  useUpdateAppointment,
} from '@/hooks/useAppointments';
import { useCreatePatient } from '@/hooks/usePatients';
import { useDoctors } from '@/hooks/useStaff';
import { useServices } from '@/hooks/useServices';
import { PatientSearchInput } from '@/components/shared/PatientSearchInput';
import { useT, getStatusLabel } from '@/lib/translations';
import type { Database } from '@/types/supabase';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

const STATUSES = [
  'SCHEDULED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW',
] as const;
type ApptStatus = (typeof STATUSES)[number];

export interface ApptModalProps {
  appointment:
    | (Appointment & { patient?: { first_name: string; last_name: string } | null })
    | null;
  isAr: boolean;
  onClose: () => void;
}

export function AppointmentModal({ appointment, isAr, onClose }: ApptModalProps) {
  const t = useT(isAr);
  const isEdit = !!appointment;
  const [apptType, setApptType] = useState<'patient' | 'walkin'>(
    appointment?.patient_id ? 'patient' : 'walkin'
  );

  const startDt = appointment?.start_time ? new Date(appointment.start_time) : null;

  const [form, setForm] = useState({
    patient_id: appointment?.patient_id ?? '',
    walk_in_name: appointment?.walk_in_name ?? '',
    walk_in_phone: appointment?.walk_in_phone ?? '',
    doctor_ref_id:
      (appointment as (Appointment & { doctor_ref_id?: string | null }) | null)
        ?.doctor_ref_id ?? appointment?.doctor_id ?? '',
    service_id: appointment?.service_id ?? '',
    date: startDt ? startDt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    time: startDt ? startDt.toTimeString().slice(0, 5) : '09:00',
    status: (appointment?.status ?? 'SCHEDULED') as ApptStatus,
    notes: appointment?.notes ?? '',
  });
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    patient?: string; walkin?: string; date?: string; time?: string;
  }>({});

  const { data: doctors = [] } = useDoctors();
  const { data: services = [] } = useServices();
  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const createPatient = useCreatePatient();
  const isPending = create.isPending || update.isPending || createPatient.isPending;

  const handleQuickCreatePatient = async (input: {
    first_name: string; last_name: string; phone?: string;
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
      const raw = err instanceof Error ? err.message : ((err as { message?: string })?.message ?? '');
      let msg = isAr ? 'تعذر إنشاء المريض.' : 'Failed to create patient.';
      if (raw.includes('patients_clinic_phone_unique_idx') || raw.includes('unique') && raw.includes('phone')) {
        msg = isAr
          ? 'هذا الرقم مسجّل لمريض آخر. استخدم "مريض مسجّل" للبحث عنه.'
          : 'This phone number belongs to an existing patient. Use "Registered Patient" to find them.';
      } else if (raw) {
        msg = raw;
      }
      setSubmitError(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setFieldErrors({});

    const nextErrors: { patient?: string; walkin?: string; date?: string; time?: string } = {};
    if (apptType === 'patient' && !form.patient_id)
      nextErrors.patient = isAr ? 'اختر مريضًا أو أنشئ مريضًا جديدًا.' : 'Select a patient or create a new one.';
    if (apptType === 'walkin' && !form.walk_in_name.trim())
      nextErrors.walkin = isAr ? 'الرجاء إدخال اسم الزائر.' : 'Please enter the walk-in name.';
    if (!form.date)
      nextErrors.date = isAr ? 'الرجاء اختيار تاريخ.' : 'Please select a date.';
    if (!form.time)
      nextErrors.time = isAr ? 'الرجاء اختيار وقت.' : 'Please select a time.';
    if (Object.keys(nextErrors).length > 0) { setFieldErrors(nextErrors); return; }

    const startDtObj = new Date(`${form.date}T${form.time}:00`);
    const startTime = startDtObj.toISOString();
    const endTime = new Date(startDtObj.getTime() + 30 * 60 * 1000).toISOString();

    let resolvedPatientId: string | null = apptType === 'patient' ? form.patient_id || null : null;

    try {
      if (apptType === 'walkin' && !isEdit) {
        const nameParts = form.walk_in_name.trim().split(/\s+/);
        const firstName = nameParts[0] ?? form.walk_in_name.trim();
        const lastName = nameParts.slice(1).join(' ') || '-';
        const newPatient = await createPatient.mutateAsync({
          first_name: firstName, last_name: lastName,
          phone: form.walk_in_phone.trim() || null,
        } as { first_name: string; last_name: string; phone: string | null });
        resolvedPatientId = newPatient.id;
      }

      const payload: Partial<AppointmentInsert> = {
        patient_id: resolvedPatientId,
        walk_in_name: isEdit && apptType === 'walkin' ? form.walk_in_name.trim() || null : null,
        walk_in_phone: isEdit && apptType === 'walkin' ? form.walk_in_phone.trim() || null : null,
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
        await create.mutateAsync(payload as Omit<AppointmentInsert, 'clinic_id' | 'created_by'>);
      }

      // Telegram notification (fire-and-forget)
      const patientName = apptType === 'walkin' ? form.walk_in_name.trim() : '';
      const serviceName = services.find(s => s.id === form.service_id)?.name ?? '';
      const doctorName  = doctors.find(d => d.id === form.doctor_ref_id)?.full_name ?? '';
      fetch('/api/notify-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isEdit ? 'updated' : 'created',
          patientName,
          date: form.date,
          time: form.time,
          service: serviceName,
          doctor: doctorName,
          status: getStatusLabel(form.status, true),
        }),
      }).catch(() => null);

      onClose();
    } catch (err) {
      const raw = err instanceof Error ? err.message : ((err as { message?: string })?.message ?? '');
      let msg = raw || (isAr ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.');
      if (raw.includes('patients_clinic_phone_unique_idx') || raw.includes('unique') && raw.includes('phone')) {
        msg = isAr
          ? 'هذا الرقم مسجّل لمريض آخر. استخدم "مريض مسجّل" للبحث عنه.'
          : 'This phone number belongs to an existing patient. Use "Registered Patient" to find them.';
      } else if (raw.includes('appointments_overlap') || raw.includes('overlap')) {
        msg = isAr ? 'يوجد موعد آخر في نفس الوقت.' : 'Another appointment exists at the same time.';
      } else if (raw.includes('foreign key') || raw.includes('fkey')) {
        msg = isAr ? 'بيانات غير صحيحة. تحقق من الحقول وأعد المحاولة.' : 'Invalid data. Check the fields and try again.';
      }
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
          <button className="ds-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type toggle */}
          <div>
            <label className="ds-label">{isAr ? 'نوع الموعد' : 'Appointment Type'}</label>
            <div style={{ display: 'flex', borderRadius: 10, border: '1px solid var(--brd)', overflow: 'hidden' }}>
              {(['patient', 'walkin'] as const).map((tp) => (
                <button key={tp} type="button" onClick={() => setApptType(tp)}
                  style={{
                    flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: 'none',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: apptType === tp ? 'var(--p2)' : 'transparent',
                    color: apptType === tp ? '#fff' : 'var(--txt2)',
                  }}
                >
                  {tp === 'patient' ? (isAr ? 'مريض مسجل' : 'Registered Patient') : (isAr ? 'زيارة مباشرة' : 'Walk-in')}
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
                onChange={(id) => { setForm((f) => ({ ...f, patient_id: id })); setFieldErrors((prev) => ({ ...prev, patient: undefined })); }}
                isAr={isAr}
                onQuickCreate={handleQuickCreatePatient}
                quickCreateLoading={createPatient.isPending}
              />
              {fieldErrors.patient && <p className="ds-error" style={{ marginTop: 6 }}>{fieldErrors.patient}</p>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="ds-label">{isAr ? 'اسم الزائر *' : 'Walk-in Name *'}</label>
                <input required className="ds-input" value={form.walk_in_name}
                  onChange={(e) => { setForm((f) => ({ ...f, walk_in_name: e.target.value })); setFieldErrors((prev) => ({ ...prev, walkin: undefined })); }}
                  placeholder={isAr ? 'الاسم الكامل' : 'Full name'}
                />
                {fieldErrors.walkin && <p className="ds-error" style={{ marginTop: 6 }}>{fieldErrors.walkin}</p>}
              </div>
              <div>
                <label className="ds-label">{isAr ? 'هاتف الزائر' : 'Walk-in Phone'}</label>
                <input type="tel" className="ds-input" value={form.walk_in_phone}
                  onChange={(e) => setForm((f) => ({ ...f, walk_in_phone: e.target.value }))}
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>
          )}

          {/* Doctor & Service */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{t.doctor}</label>
              <select className="ds-input" value={form.doctor_ref_id}
                onChange={(e) => setForm((f) => ({ ...f, doctor_ref_id: e.target.value }))}
              >
                <option value="">{isAr ? '— بدون طبيب —' : '— No doctor assigned —'}</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              {doctors.length === 0 && (
                <p style={{ fontSize: 11, color: 'var(--warn)', marginTop: 4 }}>
                  {isAr ? 'لا يوجد أطباء. أضف من صفحة الفريق.' : 'No doctors found. Add in Staff page.'}
                </p>
              )}
            </div>
            <div>
              <label className="ds-label">{t.service}</label>
              <select className="ds-input" value={form.service_id}
                onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))}
              >
                <option value="">{t.selectService}</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {services.length === 0 && (
                <p style={{ fontSize: 11, color: 'var(--warn)', marginTop: 4 }}>
                  {isAr ? 'لا توجد خدمات. أضف من صفحة الخدمات.' : 'No services found. Add in Services page.'}
                </p>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{t.date} *</label>
              <input required type="date" className="ds-input" value={form.date}
                onChange={(e) => { setForm((f) => ({ ...f, date: e.target.value })); setFieldErrors((prev) => ({ ...prev, date: undefined })); }}
              />
              {fieldErrors.date && <p className="ds-error" style={{ marginTop: 6 }}>{fieldErrors.date}</p>}
            </div>
            <div>
              <label className="ds-label">{t.time} *</label>
              <input required type="time" className="ds-input" value={form.time}
                onChange={(e) => { setForm((f) => ({ ...f, time: e.target.value })); setFieldErrors((prev) => ({ ...prev, time: undefined })); }}
              />
              {fieldErrors.time && <p className="ds-error" style={{ marginTop: 6 }}>{fieldErrors.time}</p>}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="ds-label">{t.status}</label>
            <select className="ds-input" value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ApptStatus }))}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s, isAr)}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="ds-label">{t.notes}</label>
            <textarea className="ds-input" style={{ resize: 'none' }} rows={2} value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder={isAr ? 'ملاحظات إضافية...' : 'Any additional notes...'}
            />
          </div>

          {submitError && <p className="ds-error">{submitError}</p>}

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="submit" disabled={isPending} className="ds-btn ds-btn-primary" style={{ flex: 1 }}>
              {isPending
                ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                : isEdit ? t.save : (isAr ? 'حجز الموعد' : 'Book Appointment')}
            </button>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-ghost">{t.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
