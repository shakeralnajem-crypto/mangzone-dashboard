import { useState } from 'react';
import { Users, UserCog, Stethoscope, CalendarDays, ReceiptText, Plus, Edit2, Trash2, X } from 'lucide-react';
import {
  useStaff, useStaffStats, useDoctorsTable, useCreateDoctor, useUpdateDoctor, useDeleteDoctor,
  useClinicStaff, useCreateClinicStaff, useUpdateClinicStaff, useDeleteClinicStaff,
  type StaffRole, type ClinicStaffMember,
} from '@/hooks/useStaff';
import { formatEGP } from '@/lib/currency';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Doctor = Database['public']['Tables']['doctors']['Row'];

const ROLE_COLORS: Record<string, string> = {
  ADMIN:        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DOCTOR:       'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  RECEPTIONIST: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  ACCOUNTANT:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  MARKETING:    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  NURSE:        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  OTHER:        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const STAFF_ROLES: StaffRole[] = ['RECEPTIONIST', 'ACCOUNTANT', 'MARKETING', 'NURSE', 'OTHER'];

// ─── Add / Edit Clinic Staff Modal ───────────────────────────────────────────

interface StaffModalProps {
  member: ClinicStaffMember | null;
  onClose: () => void;
}

function StaffMemberModal({ member, onClose }: StaffModalProps) {
  const isEdit = !!member;
  const [form, setForm] = useState({
    full_name: member?.full_name ?? '',
    role: (member?.role ?? 'RECEPTIONIST') as StaffRole,
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    is_active: member?.is_active ?? true,
  });
  const [submitError, setSubmitError] = useState('');

  const create = useCreateClinicStaff();
  const update = useUpdateClinicStaff();
  const isPending = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!form.full_name.trim()) { setSubmitError('الاسم مطلوب.'); return; }
    try {
      if (isEdit && member) {
        await update.mutateAsync({ id: member.id, full_name: form.full_name.trim(), role: form.role, phone: form.phone.trim() || null, email: form.email.trim() || null, is_active: form.is_active });
      } else {
        await create.mutateAsync({ full_name: form.full_name.trim(), role: form.role, phone: form.phone.trim() || null, email: form.email.trim() || null, is_active: form.is_active });
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'حدث خطأ.');
    }
  };

  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? 'تعديل موظف' : 'إضافة موظف'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الاسم *</label>
            <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={fieldClass} placeholder="اسم الموظف" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الوظيفة</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as StaffRole }))} className={fieldClass}>
              <option value="RECEPTIONIST">رسبشن</option>
              <option value="ACCOUNTANT">محاسب</option>
              <option value="MARKETING">ماركتنج</option>
              <option value="NURSE">ممرض/ة</option>
              <option value="OTHER">أخرى</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الهاتف</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={fieldClass} placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الإيميل</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={fieldClass} placeholder="staff@clinic.com" />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <div className={`h-5 w-9 rounded-full transition-colors ${form.is_active ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">نشط</span>
          </label>
          {submitError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{submitError}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
              {isPending ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة الموظف'}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add / Edit Doctor Modal ──────────────────────────────────────────────────

interface DoctorModalProps {
  doctor: Doctor | null; // null = new
  onClose: () => void;
}

function DoctorModal({ doctor, onClose }: DoctorModalProps) {
  const isEdit = !!doctor;
  const [form, setForm] = useState({
    full_name: doctor?.full_name ?? '',
    specialization: doctor?.specialization ?? '',
    phone: doctor?.phone ?? '',
    email: doctor?.email ?? '',
    is_active: doctor?.is_active ?? true,
  });
  const [submitError, setSubmitError] = useState('');

  const create = useCreateDoctor();
  const update = useUpdateDoctor();
  const isPending = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!form.full_name.trim()) {
      setSubmitError('Full name is required.');
      return;
    }
    try {
      if (isEdit && doctor) {
        await update.mutateAsync({
          id: doctor.id,
          full_name: form.full_name.trim(),
          specialization: form.specialization.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          is_active: form.is_active,
        });
      } else {
        await create.mutateAsync({
          full_name: form.full_name.trim(),
          specialization: form.specialization.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          is_active: form.is_active,
        });
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Doctor' : 'Add Doctor'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Full Name *
            </label>
            <input
              required
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className={fieldClass}
              placeholder="Dr. Ahmed Mohamed"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Specialization
            </label>
            <input
              value={form.specialization}
              onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
              className={fieldClass}
              placeholder="e.g. Orthodontics, Endodontics"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={fieldClass}
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={fieldClass}
                placeholder="doctor@clinic.com"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              />
              <div className={`h-5 w-9 rounded-full transition-colors ${form.is_active ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
          </label>

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
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Doctor'}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  bg: string;
  iconColor: string;
}

function StatCard({ icon: Icon, label, value, bg, iconColor }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

interface DoctorCardProps {
  doctor: Doctor;
  apptCount: number;
  billedAmount: number;
  onEdit: (d: Doctor) => void;
  onDelete: (d: Doctor) => void;
}

function DoctorCard({ doctor, apptCount, billedAmount, onEdit, onDelete }: DoctorCardProps) {
  const initials = doctor.full_name
    .split(' ')
    .slice(0, 2)
    .map(p => p.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 text-lg font-bold text-brand-700 dark:from-brand-900/40 dark:to-brand-800/40 dark:text-brand-300">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{doctor.full_name}</p>
              {doctor.specialization && (
                <p className="text-xs text-slate-400 dark:text-slate-500">{doctor.specialization}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(doctor)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(doctor)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {doctor.phone && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{doctor.phone}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Appointments
          </div>
          <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">{apptCount}</p>
        </div>
        <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <ReceiptText className="h-3.5 w-3.5" />
            Billed
          </div>
          <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">{formatEGP(billedAmount)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${doctor.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
          {doctor.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  RECEPTIONIST: 'رسبشن',
  ACCOUNTANT:   'محاسب',
  MARKETING:    'ماركتنج',
  NURSE:        'ممرض/ة',
  OTHER:        'أخرى',
};

export function StaffPage() {
  const [doctorModal, setDoctorModal] = useState<Doctor | null | 'new'>(null);
  const [staffModal, setStaffModal] = useState<ClinicStaffMember | null | 'new'>(null);

  const { data: staff = [], isLoading: staffLoading, error: staffError } = useStaff();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctorsTable();
  const { data: clinicStaff = [], isLoading: clinicStaffLoading } = useClinicStaff();
  const { data: statsData } = useStaffStats();
  const deleteDoctor = useDeleteDoctor();
  const deleteMember = useDeleteClinicStaff();

  const nonDoctors = staff.filter(s => s.role !== 'DOCTOR');
  const activeDoctors = doctors.filter(d => d.is_active).length;

  const isLoading = staffLoading || doctorsLoading || clinicStaffLoading;
  const errorMessage = staffError instanceof Error ? staffError.message : 'Failed to load staff.';

  const handleDeleteDoctor = async (doctor: Doctor) => {
    if (!confirm(`حذف د. ${doctor.full_name}؟ لا يمكن التراجع.`)) return;
    await deleteDoctor.mutateAsync(doctor.id);
  };

  const handleDeleteMember = async (m: ClinicStaffMember) => {
    if (!confirm(`حذف ${m.full_name}؟ لا يمكن التراجع.`)) return;
    await deleteMember.mutateAsync(m.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">الفريق</h1>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {doctors.length + clinicStaff.length} عضو
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStaffModal('new')}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-4 w-4" /> إضافة موظف
            </button>
            <button
              onClick={() => setDoctorModal('new')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> إضافة طبيب
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          إدارة الدكاترة والموظفين.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        </div>
      ) : staffError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Users}       label="الموظفون"        value={clinicStaff.length} bg="bg-slate-100 dark:bg-slate-800"   iconColor="text-slate-600 dark:text-slate-300" />
            <StatCard icon={Stethoscope} label="الدكاترة"        value={doctors.length}     bg="bg-brand-50 dark:bg-brand-900/20"  iconColor="text-brand-600 dark:text-brand-400" />
            <StatCard icon={UserCog}     label="دكاترة نشطون"   value={activeDoctors}      bg="bg-green-50 dark:bg-green-900/20"  iconColor="text-green-600 dark:text-green-400" />
          </div>

          {/* Doctor cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الدكاترة</h2>
              <button onClick={() => setDoctorModal('new')} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                <Plus className="h-3.5 w-3.5" /> إضافة طبيب
              </button>
            </div>
            {doctors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <Stethoscope className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">لا يوجد دكاترة بعد.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {doctors.map(doc => (
                  <DoctorCard key={doc.id} doctor={doc}
                    apptCount={statsData?.apptCounts.get(doc.id) ?? 0}
                    billedAmount={statsData?.billedAmounts.get(doc.id) ?? 0}
                    onEdit={(d) => setDoctorModal(d)}
                    onDelete={handleDeleteDoctor}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Clinic Staff table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الموظفون</h2>
              <button onClick={() => setStaffModal('new')} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                <Plus className="h-3.5 w-3.5" /> إضافة موظف
              </button>
            </div>
            {clinicStaff.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <Users className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">لا يوجد موظفون بعد.</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">اضغط "إضافة موظف" لإضافة رسبشن أو محاسب أو غيره.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الاسم</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الهاتف</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الوظيفة</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الحالة</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {clinicStaff.map((m) => (
                      <tr key={m.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {m.full_name.split(' ').slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase()}
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{m.full_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{m.phone ?? '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[m.role] ?? ''}`}>
                            {ROLE_LABEL[m.role] ?? m.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {m.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setStaffModal(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteMember(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Auth-based staff (read-only) */}
          {nonDoctors.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">حسابات النظام</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الاسم</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الهاتف</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الصلاحية</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {nonDoctors.map((s: Profile) => (
                      <tr key={s.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {s.full_name.split(' ').slice(0, 2).map((p: string) => p.charAt(0)).join('').toUpperCase()}
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{s.full_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{s.phone ?? '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[s.role] ?? ''}`}>{s.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {s.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {doctorModal !== null && (
        <DoctorModal doctor={doctorModal === 'new' ? null : doctorModal} onClose={() => setDoctorModal(null)} />
      )}
      {staffModal !== null && (
        <StaffMemberModal member={staffModal === 'new' ? null : staffModal} onClose={() => setStaffModal(null)} />
      )}
    </div>
  );
}
