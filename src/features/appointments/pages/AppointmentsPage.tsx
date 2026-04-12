import { useState, useRef, useEffect } from 'react';
import { Calendar, Download, GitCompareArrows, Plus, X, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useDoctors } from '@/hooks/useStaff';
import { useServices } from '@/hooks/useServices';
import { exportToCsv } from '@/lib/exportCsv';
import type { Database } from '@/types/supabase';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

const STATUSES = ['SCHEDULED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
type ApptStatus = typeof STATUSES[number];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ARRIVED:     'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  NO_SHOW:     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ id, current, onUpdate }: { id: string; current: string; onUpdate: (id: string, s: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 ${STATUS_COLORS[current] ?? ''}`}
      >
        {current.replace('_', ' ')}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-30 min-w-[160px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { onUpdate(id, s); setOpen(false); }}
              className={`w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${current === s ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Appointment Modal ────────────────────────────────────────────────────────

interface ApptModalProps {
  appointment: (Appointment & { patient?: { first_name: string; last_name: string } | null }) | null;
  onClose: () => void;
}

function AppointmentModal({ appointment, onClose }: ApptModalProps) {
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
    doctor_ref_id: (appointment as (Appointment & { doctor_ref_id?: string | null }) | null)?.doctor_ref_id ?? appointment?.doctor_id ?? '',
    service_id: appointment?.service_id ?? '',
    date: startDt ? startDt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    time: startDt ? startDt.toTimeString().slice(0, 5) : '09:00',
    status: (appointment?.status ?? 'SCHEDULED') as ApptStatus,
    notes: appointment?.notes ?? '',
  });
  const [submitError, setSubmitError] = useState('');

  const { data: patients = [] } = usePatients('');
  const { data: doctors = [] } = useDoctors();
  const { data: services = [] } = useServices();

  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const isPending = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const startDtObj = new Date(`${form.date}T${form.time}:00`);
    const startTime = startDtObj.toISOString();
    const endTime = new Date(startDtObj.getTime() + 30 * 60 * 1000).toISOString();

    const payload: Partial<AppointmentInsert> = {
      patient_id: apptType === 'patient' ? (form.patient_id || null) : null,
      walk_in_name: apptType === 'walkin' ? (form.walk_in_name.trim() || null) : null,
      walk_in_phone: apptType === 'walkin' ? (form.walk_in_phone.trim() || null) : null,
      doctor_ref_id: form.doctor_ref_id || null,
      service_id: form.service_id || null,
      start_time: startTime,
      end_time: endTime,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    // Validate
    if (apptType === 'patient' && !form.patient_id) {
      setSubmitError('Please select a patient.');
      return;
    }
    if (apptType === 'walkin' && !form.walk_in_name.trim()) {
      setSubmitError('Please enter the walk-in patient name.');
      return;
    }
    if (!form.date) {
      setSubmitError('Please select a date.');
      return;
    }
    if (!form.time) {
      setSubmitError('Please select a time.');
      return;
    }

    try {
      if (isEdit && appointment) {
        await update.mutateAsync({ id: appointment.id, values: payload });
      } else {
        await create.mutateAsync(payload as Omit<AppointmentInsert, 'clinic_id' | 'created_by'>);
      }
      onClose();
    } catch (err) {
      console.error('Appointment save error:', err);
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'An error occurred. Please try again.';
      setSubmitError(msg);
    }
  };

  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient type toggle */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Appointment Type
            </label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden dark:border-slate-700">
              <button
                type="button"
                onClick={() => setApptType('patient')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${apptType === 'patient' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
              >
                Registered Patient
              </button>
              <button
                type="button"
                onClick={() => setApptType('walkin')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${apptType === 'walkin' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
              >
                Walk-in
              </button>
            </div>
          </div>

          {/* Patient or Walk-in fields */}
          {apptType === 'patient' ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Patient
              </label>
              <select
                value={form.patient_id}
                onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
                className={fieldClass}
              >
                <option value="">— Select patient —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}{p.phone ? ` · ${p.phone}` : ''}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Walk-in Name *
                </label>
                <input
                  required={apptType === 'walkin'}
                  value={form.walk_in_name}
                  onChange={e => setForm(f => ({ ...f, walk_in_name: e.target.value }))}
                  className={fieldClass}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Walk-in Phone
                </label>
                <input
                  type="tel"
                  value={form.walk_in_phone}
                  onChange={e => setForm(f => ({ ...f, walk_in_phone: e.target.value }))}
                  className={fieldClass}
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>
          )}

          {/* Doctor & Service */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Doctor
              </label>
              <select
                value={form.doctor_ref_id}
                onChange={e => setForm(f => ({ ...f, doctor_ref_id: e.target.value }))}
                className={fieldClass}
              >
                <option value="">— No doctor assigned —</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              {doctors.length === 0 && (
                <p className="mt-1 text-xs text-amber-500">No doctors found. Add doctors in the Staff page first.</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Service
              </label>
              <select
                value={form.service_id}
                onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))}
                className={fieldClass}
              >
                <option value="">— No service —</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {services.length === 0 && (
                <p className="mt-1 text-xs text-amber-500">No services found. Add services in the Services page first.</p>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Date *
              </label>
              <input
                required
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Time *
              </label>
              <input
                required
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className={fieldClass}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Status
            </label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as ApptStatus }))}
              className={fieldClass}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className={`${fieldClass} resize-none`}
              placeholder="Any additional notes..."
            />
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {submitError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Book Appointment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Compare Days View ────────────────────────────────────────────────────────

function CompareDaysView() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateA, setDateA] = useState(today);
  const [dateB, setDateB] = useState(today);
  const { data: allAppointments = [] } = useAppointments();

  const filterByDate = (date: string) =>
    allAppointments
      .filter(a => a.start_time.slice(0, 10) === date)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const apptA = filterByDate(dateA);
  const apptB = filterByDate(dateB);

  const DayColumn = ({
    date, setDate, appts, label,
  }: { date: string; setDate: (d: string) => void; appts: typeof allAppointments; label: string }) => (
    <div className="flex-1 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-900">
        {appts.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No appointments on this day.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {appts.map(a => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                <div className="w-14 flex-shrink-0 text-center">
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    {new Date(a.start_time).toLocaleTimeString('en-EG', { timeStyle: 'short' })}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {a.patient
                      ? `${a.patient.first_name} ${a.patient.last_name}`
                      : (a.walk_in_name ?? '—')}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{a.service?.name ?? 'No service'}</p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[a.status ?? 'SCHEDULED'] ?? ''}`}>
                  {(a.status ?? 'SCHEDULED').replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-right text-xs text-slate-400 dark:text-slate-500">
        {appts.length} appointment{appts.length !== 1 ? 's' : ''}
      </p>
    </div>
  );

  return (
    <div className="flex gap-4">
      <DayColumn date={dateA} setDate={setDateA} appts={apptA} label="Day A" />
      <div className="w-px self-stretch bg-slate-200 dark:bg-slate-700" />
      <DayColumn date={dateB} setDate={setDateB} appts={apptB} label="Day B" />
    </div>
  );
}

// ─── Today's Doctor Grid ──────────────────────────────────────────────────────

function TodayDoctorGrid({ appointments }: { appointments: Array<Appointment & { doctor_ref_id?: string | null; patient?: { first_name: string; last_name: string } | null; doctor?: { full_name: string } | null; doctor_ref?: { full_name: string } | null; service?: { name: string } | null; walk_in_name?: string | null }> }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(a => a.start_time.slice(0, 10) === today);

  if (todayAppts.length === 0) return null;

  // Group by doctor_ref_id (new) falling back to doctor_id (legacy)
  const grouped = new Map<string, { doctorName: string; appts: typeof todayAppts }>();
  for (const a of todayAppts) {
    const key = a.doctor_ref_id ?? a.doctor_id ?? 'unassigned';
    const doctorName = a.doctor_ref?.full_name ?? a.doctor?.full_name ?? 'Unassigned';
    if (!grouped.has(key)) grouped.set(key, { doctorName, appts: [] });
    grouped.get(key)!.appts.push(a);
  }
  const groups = Array.from(grouped.values()).sort((a, b) => a.doctorName.localeCompare(b.doctorName));

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Today's Schedule — {new Date().toLocaleDateString('en-EG', { dateStyle: 'full' })}
        <span className="ml-2 font-normal normal-case text-slate-400 dark:text-slate-500">({todayAppts.length} appointments)</span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map(({ doctorName, appts }) => (
          <div key={doctorName} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-xs font-bold text-brand-700 dark:from-brand-900/40 dark:to-brand-800/40 dark:text-brand-300">
                  {doctorName.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{doctorName}</span>
              </div>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                {appts.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {appts
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-12 flex-shrink-0 text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {new Date(a.start_time).toLocaleTimeString('en-EG', { timeStyle: 'short' })}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                        {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : (a.walk_in_name ?? '—')}
                      </p>
                      <p className="truncate text-xs text-slate-400">{a.service?.name ?? 'No service'}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[a.status ?? 'SCHEDULED'] ?? ''}`}>
                      {(a.status ?? 'SCHEDULED').replace('_', ' ')}
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
  const [compareMode, setCompareMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<(Appointment & { patient?: { first_name: string; last_name: string } | null }) | null>(null);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: doctors = [] } = useDoctors();
  const { data: allAppointments = [], isLoading, error } = useAppointments({
    doctorId: filterDoctor || undefined,
    status: filterStatus || undefined,
  });

  // Client-side date filter
  const appointments = filterDate
    ? allAppointments.filter(a => a.start_time.slice(0, 10) === filterDate)
    : allAppointments;

  const updateAppt = useUpdateAppointment();
  const deleteAppt = useDeleteAppointment();

  const errorMessage = error instanceof Error ? error.message : 'Failed to load appointments.';

  const handleStatusChange = (id: string, status: string) => {
    updateAppt.mutate({ id, values: { status: status as ApptStatus } });
  };

  const handleDelete = async (a: Appointment) => {
    if (!confirm('Delete this appointment?')) return;
    await deleteAppt.mutateAsync(a.id);
  };

  const handleExport = () => {
    exportToCsv('appointments', appointments.map(a => ({
      Patient: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : (a.walk_in_name ?? ''),
      'Walk-in Phone': a.walk_in_phone ?? '',
      Service: a.service?.name ?? '',
      'Start Time': a.start_time,
      Status: a.status ?? '',
    })));
  };

  const openAdd = () => { setEditingAppt(null); setModalOpen(true); };
  const openEdit = (a: typeof appointments[number]) => { setEditingAppt(a); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingAppt(null); };

  const filterInputClass = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Appointments</h1>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {appointments.length} total
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review scheduled visits and check the current appointment status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={() => setCompareMode(m => !m)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                compareMode
                  ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <GitCompareArrows className="h-4 w-4" /> Compare Days
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add Appointment
            </button>
          </div>
        </div>

        {/* Filter bar */}
        {!compareMode && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className={filterInputClass}
            />
            <select
              value={filterDoctor}
              onChange={e => setFilterDoctor(e.target.value)}
              className={filterInputClass}
            >
              <option value="">All Doctors</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={filterInputClass}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            {(filterDate || filterDoctor || filterStatus) && (
              <button
                onClick={() => { setFilterDate(''); setFilterDoctor(''); setFilterStatus(''); }}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Today's Doctor Grid — only when no filters active and not compare mode */}
      {!compareMode && !filterDate && !filterDoctor && !filterStatus && !isLoading && (
        <TodayDoctorGrid appointments={allAppointments} />
      )}

      {/* Compare mode */}
      {compareMode ? (
        <CompareDaysView />
      ) : isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-base font-medium text-slate-700 dark:text-slate-200">No appointments found.</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Click "Add Appointment" to schedule the first one.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Add Appointment
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Patient
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Date / Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {appointments.map(a => (
                <tr key={a.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-sm font-semibold text-brand-700 dark:from-brand-900/40 dark:to-brand-800/40 dark:text-brand-300">
                        {a.patient
                          ? `${a.patient.first_name.charAt(0)}${a.patient.last_name.charAt(0)}`
                          : (a.walk_in_name ?? 'W').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {a.patient
                            ? `${a.patient.first_name} ${a.patient.last_name}`
                            : (a.walk_in_name ?? '—')}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {a.patient ? 'Patient' : 'Walk-in'}
                          {a.walk_in_phone ? ` · ${a.walk_in_phone}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      {new Date(a.start_time).toLocaleDateString('en-EG', { dateStyle: 'medium' })}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(a.start_time).toLocaleTimeString('en-EG', { timeStyle: 'short' })}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {a.service?.name ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusDropdown
                      id={a.id}
                      current={a.status ?? 'SCHEDULED'}
                      onUpdate={handleStatusChange}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(a)}
                        title="Edit appointment"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        title="Delete appointment"
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <AppointmentModal appointment={editingAppt} onClose={closeModal} />
      )}
    </div>
  );
}
