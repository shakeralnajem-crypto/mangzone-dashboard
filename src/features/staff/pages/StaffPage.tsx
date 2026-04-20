import { useState } from 'react';
import { Users, UserCog, Stethoscope, CalendarDays, ReceiptText, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useStaff, useStaffStats, useDoctorsTable, useCreateDoctor, useUpdateDoctor, useDeleteDoctor,
  useClinicStaff, useCreateClinicStaff, useUpdateClinicStaff, useDeleteClinicStaff,
  type StaffRole, type ClinicStaffMember,
} from '@/hooks/useStaff';
import { formatEGP } from '@/lib/currency';
import { useT } from '@/lib/translations';
import { useHistoryStore } from '@/store/historyStore';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Doctor = Database['public']['Tables']['doctors']['Row'];

const ROLE_CLS: Record<string, string> = {
  ADMIN:        'ds-badge ds-badge-p',
  DOCTOR:       'ds-badge ds-badge-a',
  RECEPTIONIST: 'ds-badge ds-badge-ok',
  ACCOUNTANT:   'ds-badge ds-badge-warn',
  MARKETING:    'ds-badge ds-badge-err',
  NURSE:        'ds-badge ds-badge-ok',
  OTHER:        'ds-badge ds-badge-neutral',
};

const DOCTOR_COLORS = [
  'linear-gradient(135deg,#6D28D9,#8B5CF6)',
  'linear-gradient(135deg,#0891B2,#06B6D4)',
  'linear-gradient(135deg,#059669,#10B981)',
  'linear-gradient(135deg,#D97706,#F59E0B)',
  'linear-gradient(135deg,#DC2626,#EF4444)',
];

const STAFF_ROLES: StaffRole[] = ['RECEPTIONIST', 'ACCOUNTANT', 'MARKETING', 'NURSE', 'OTHER'];

const ROLE_LABEL_EN: Record<string, string> = {
  RECEPTIONIST: 'Receptionist', ACCOUNTANT: 'Accountant',
  MARKETING: 'Marketing', NURSE: 'Nurse', OTHER: 'Other',
};
const ROLE_LABEL_AR: Record<string, string> = {
  RECEPTIONIST: 'موظف استقبال', ACCOUNTANT: 'محاسب',
  MARKETING: 'تسويق', NURSE: 'ممرض', OTHER: 'أخرى',
};

// ─── Staff Member Modal ───────────────────────────────────────────────────────

function StaffMemberModal({ member, isAr, onClose }: { member: ClinicStaffMember | null; isAr: boolean; onClose: () => void }) {
  const t = useT(isAr);
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
    if (!form.full_name.trim()) { setSubmitError(isAr ? 'الاسم مطلوب.' : 'Name is required.'); return; }
    try {
      if (isEdit && member) {
        await update.mutateAsync({ id: member.id, full_name: form.full_name.trim(), role: form.role, phone: form.phone.trim() || null, email: form.email.trim() || null, is_active: form.is_active });
      } else {
        await create.mutateAsync({ full_name: form.full_name.trim(), role: form.role, phone: form.phone.trim() || null, email: form.email.trim() || null, is_active: form.is_active });
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : (isAr ? 'حدث خطأ.' : 'An error occurred.'));
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 440 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {isEdit ? t.editStaff : t.addStaff}
          </span>
          <button className="ds-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="ds-label">{t.fullName} *</label>
            <input required className="ds-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder={isAr ? 'اسم الموظف' : 'Staff member name'} />
          </div>
          <div>
            <label className="ds-label">{t.role}</label>
            <select className="ds-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as StaffRole }))}>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{isAr ? ROLE_LABEL_AR[r] : ROLE_LABEL_EN[r]}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{t.phone}</label>
              <input type="tel" className="ds-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="ds-label">{t.email}</label>
              <input type="email" className="ds-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@clinic.com" />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: 36, height: 20, flexShrink: 0 }}>
              <input type="checkbox" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: form.is_active ? 'var(--p2)' : 'var(--brd2)', transition: 'background 0.2s' }} />
              <div style={{ position: 'absolute', top: 2, left: form.is_active ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt2)' }}>{t.active}</span>
          </label>
          {submitError && <p className="ds-error">{submitError}</p>}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="submit" disabled={isPending} className="ds-btn ds-btn-primary" style={{ flex: 1 }}>
              {isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isEdit ? t.save : (isAr ? 'إضافة موظف' : 'Add Member')}
            </button>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-ghost">{t.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Doctor Modal ─────────────────────────────────────────────────────────────

function DoctorModal({ doctor, isAr, onClose }: { doctor: Doctor | null; isAr: boolean; onClose: () => void }) {
  const t = useT(isAr);
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
    if (!form.full_name.trim()) { setSubmitError(isAr ? 'الاسم مطلوب.' : 'Full name is required.'); return; }
    try {
      if (isEdit && doctor) {
        await update.mutateAsync({ id: doctor.id, full_name: form.full_name.trim(), specialization: form.specialization.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null, is_active: form.is_active });
      } else {
        await create.mutateAsync({ full_name: form.full_name.trim(), specialization: form.specialization.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null, is_active: form.is_active });
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : (isAr ? 'حدث خطأ.' : 'An error occurred.'));
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 440 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {isEdit ? t.editDoctor : t.addDoctor}
          </span>
          <button className="ds-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="ds-label">{t.fullName} *</label>
            <input required className="ds-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder={isAr ? 'د. أحمد محمد' : 'Dr. Ahmed Mohamed'} />
          </div>
          <div>
            <label className="ds-label">{t.specialization}</label>
            <input className="ds-input" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} placeholder={isAr ? 'مثال: تقويم، علاج جذور' : 'e.g. Orthodontics, Endodontics'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{t.phone}</label>
              <input type="tel" className="ds-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="ds-label">{t.email}</label>
              <input type="email" className="ds-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="doctor@clinic.com" />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: 36, height: 20, flexShrink: 0 }}>
              <input type="checkbox" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: form.is_active ? 'var(--p2)' : 'var(--brd2)', transition: 'background 0.2s' }} />
              <div style={{ position: 'absolute', top: 2, left: form.is_active ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt2)' }}>{t.active}</span>
          </label>
          {submitError && <p className="ds-error">{submitError}</p>}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="submit" disabled={isPending} className="ds-btn ds-btn-primary" style={{ flex: 1 }}>
              {isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isEdit ? t.save : t.addDoctor}
            </button>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-ghost">{t.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Doctor Card ──────────────────────────────────────────────────────────────

function DoctorCard({ doctor, apptCount, billedAmount, isAr, onEdit, onDelete, colorIdx }: {
  doctor: Doctor; apptCount: number; billedAmount: number; isAr: boolean;
  onEdit: (d: Doctor) => void; onDelete: (d: Doctor) => void; colorIdx: number;
}) {
  const t = useT(isAr);
  const { can } = usePermissions();
  const initials = doctor.full_name.split(' ').slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase();

  return (
    <div className="ds-card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div className="ds-avatar" style={{ width: 50, height: 50, fontSize: 17, flexShrink: 0, background: DOCTOR_COLORS[colorIdx % DOCTOR_COLORS.length] }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doctor.full_name}</p>
              {doctor.specialization && <p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{doctor.specialization}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <button onClick={() => onEdit(doctor)} className="ds-icon-btn"><Edit2 size={13} /></button>
              {can('delete:staff') && (
                <button onClick={() => onDelete(doctor)} className="ds-icon-btn-err"><Trash2 size={13} /></button>
              )}
            </div>
          </div>
          {doctor.phone && <p style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 4 }}>{doctor.phone}</p>}
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, borderRadius: 10, background: 'var(--p-ultra)', padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--txt3)', marginBottom: 4 }}>
            <CalendarDays size={11} /> {t.appointments_count}
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)' }}>{apptCount}</p>
        </div>
        <div style={{ flex: 1, borderRadius: 10, background: 'var(--a-soft)', padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--txt3)', marginBottom: 4 }}>
            <ReceiptText size={11} /> {isAr ? 'مُحاسَب' : 'Billed'}
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{formatEGP(billedAmount)}</p>
        </div>
        <span className={doctor.is_active ? 'ds-badge ds-badge-ok' : 'ds-badge ds-badge-neutral'}>
          {doctor.is_active ? t.active : t.inactive}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function StaffPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [doctorModal, setDoctorModal] = useState<Doctor | null | 'new'>(null);
  const [staffModal, setStaffModal] = useState<ClinicStaffMember | null | 'new'>(null);

  const { data: staff = [], isLoading: staffLoading, error: staffError } = useStaff();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctorsTable();
  const { data: clinicStaff = [], isLoading: clinicStaffLoading } = useClinicStaff();
  const { data: statsData } = useStaffStats();
  const deleteDoctor = useDeleteDoctor();
  const deleteMember = useDeleteClinicStaff();
  const createDoctor = useCreateDoctor();
  const createMember = useCreateClinicStaff();
  const { pushAction } = useHistoryStore();
  const { can } = usePermissions();

  const nonDoctors = staff.filter(s => s.role !== 'DOCTOR');
  const activeDoctors = doctors.filter(d => d.is_active).length;
  const isLoading = staffLoading || doctorsLoading || clinicStaffLoading;
  const errorMessage = staffError instanceof Error ? staffError.message : (isAr ? 'فشل تحميل الفريق.' : 'Failed to load staff.');

  const handleDeleteDoctor = async (doctor: Doctor) => {
    if (!confirm(`${isAr ? 'حذف الطبيب' : 'Delete Dr.'} ${doctor.full_name}?`)) return;
    await deleteDoctor.mutateAsync(doctor.id);
    let restoredId = doctor.id;
    pushAction({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: `Deleted doctor: Dr. ${doctor.full_name}`,
      description_ar: `حُذف الطبيب: د. ${doctor.full_name}`,
      undo: async () => {
        const created = await createDoctor.mutateAsync({
          full_name: doctor.full_name,
          specialization: doctor.specialization,
          phone: doctor.phone,
          email: doctor.email,
          is_active: doctor.is_active,
        });
        restoredId = created.id;
      },
      redo: async () => { await deleteDoctor.mutateAsync(restoredId); },
    });
  };

  const handleDeleteMember = async (m: ClinicStaffMember) => {
    if (!confirm(`${isAr ? 'حذف' : 'Delete'} ${m.full_name}?`)) return;
    await deleteMember.mutateAsync(m.id);
    let restoredId = m.id;
    pushAction({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: `Deleted staff member: ${m.full_name}`,
      description_ar: `حُذف عضو الفريق: ${m.full_name}`,
      undo: async () => {
        const created = await createMember.mutateAsync({
          full_name: m.full_name,
          role: m.role,
          phone: m.phone,
          email: m.email,
          is_active: m.is_active,
        });
        restoredId = created.id;
      },
      redo: async () => { await deleteMember.mutateAsync(restoredId); },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>

      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="ds-badge ds-badge-p" style={{ fontSize: 12, padding: '4px 10px' }}>
            {doctors.length + clinicStaff.length} {isAr ? 'عضو' : 'members'}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setStaffModal('new')} className="ds-btn ds-btn-ghost" style={{ gap: 6 }}>
            <Plus size={14} /> {t.addStaff}
          </button>
          <button onClick={() => setDoctorModal('new')} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addDoctor}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="ds-card" style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : staffError ? (
        <div className="ds-card" style={{ padding: 18, background: 'var(--err-soft)', border: '1px solid var(--err)', color: 'var(--err)' }}>
          {errorMessage}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: Users,       label: isAr ? 'الموظفون' : 'Staff Members', value: clinicStaff.length, cls: 'ds-stat-neutral' },
              { icon: Stethoscope, label: isAr ? 'الأطباء'  : 'Doctors',        value: doctors.length,     cls: 'ds-stat-p' },
              { icon: UserCog,     label: isAr ? 'أطباء نشطون' : 'Active Doctors', value: activeDoctors,   cls: 'ds-stat-ok' },
            ].map(item => (
              <div key={item.label} className={`ds-stat ${item.cls}`}>
                <div className="ds-stat-icon"><item.icon size={18} /></div>
                <div>
                  <div className="ds-stat-label">{item.label}</div>
                  <div className="ds-stat-value">{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Doctor cards */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--txt3)', margin: 0 }}>
                {isAr ? 'الأطباء' : 'Doctors'}
              </h2>
              <button onClick={() => setDoctorModal('new')} className="ds-btn ds-btn-ghost" style={{ gap: 5, padding: '5px 10px', fontSize: 11 }}>
                <Plus size={12} /> {t.addDoctor}
              </button>
            </div>
            {doctors.length === 0 ? (
              <div className="ds-empty" style={{ padding: '40px 24px' }}>
                <Stethoscope size={36} style={{ color: 'var(--txt3)', marginBottom: 12 }} />
                <p style={{ fontSize: 14, color: 'var(--txt3)' }}>{isAr ? 'لم يتم إضافة أطباء بعد.' : 'No doctors added yet.'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {doctors.map((doc, idx) => (
                  <DoctorCard
                    key={doc.id}
                    doctor={doc}
                    colorIdx={idx}
                    isAr={isAr}
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--txt3)', margin: 0 }}>
                {isAr ? 'موظفو العيادة' : 'Staff Members'}
              </h2>
              <button onClick={() => setStaffModal('new')} className="ds-btn ds-btn-ghost" style={{ gap: 5, padding: '5px 10px', fontSize: 11 }}>
                <Plus size={12} /> {t.addStaff}
              </button>
            </div>
            {clinicStaff.length === 0 ? (
              <div className="ds-empty" style={{ padding: '40px 24px' }}>
                <Users size={36} style={{ color: 'var(--txt3)', marginBottom: 12 }} />
                <p style={{ fontSize: 14, color: 'var(--txt3)' }}>{isAr ? 'لم يتم إضافة موظفين بعد.' : 'No staff members added yet.'}</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="ds-card hidden md:block" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="ds-table">
                    <thead>
                      <tr>
                        <th className="ds-th">{t.name}</th>
                        <th className="ds-th">{t.phone}</th>
                        <th className="ds-th">{t.role}</th>
                        <th className="ds-th">{t.status}</th>
                        <th className="ds-th" style={{ textAlign: 'right' }}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clinicStaff.map((m) => (
                        <tr key={m.id} className="ds-tbody-row">
                          <td className="ds-td">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="ds-avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                                {m.full_name.split(' ').slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase()}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{m.full_name}</span>
                            </div>
                          </td>
                          <td className="ds-td" style={{ fontSize: 13, color: 'var(--txt2)' }}>{m.phone ?? '—'}</td>
                          <td className="ds-td">
                            <span className={ROLE_CLS[m.role] ?? 'ds-badge ds-badge-neutral'}>
                              {isAr ? (ROLE_LABEL_AR[m.role] ?? m.role) : (ROLE_LABEL_EN[m.role] ?? m.role)}
                            </span>
                          </td>
                          <td className="ds-td">
                            <span className={m.is_active ? 'ds-badge ds-badge-ok' : 'ds-badge ds-badge-neutral'}>
                              {m.is_active ? t.active : t.inactive}
                            </span>
                          </td>
                          <td className="ds-td">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                              <button onClick={() => setStaffModal(m)} className="ds-icon-btn"><Edit2 size={13} /></button>
                              {can('delete:staff') && (
                                <button onClick={() => handleDeleteMember(m)} className="ds-icon-btn-err"><Trash2 size={13} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="flex flex-col gap-3 md:hidden">
                  {clinicStaff.map((m) => (
                    <div key={m.id} className="ds-card" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="ds-avatar" style={{ width: 40, height: 40, fontSize: 13, flexShrink: 0 }}>
                          {m.full_name.split(' ').slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{m.full_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>{m.phone ?? '—'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setStaffModal(m)} className="ds-icon-btn"><Edit2 size={14} /></button>
                          {can('delete:staff') && (
                            <button onClick={() => handleDeleteMember(m)} className="ds-icon-btn-err"><Trash2 size={14} /></button>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <span className={ROLE_CLS[m.role] ?? 'ds-badge ds-badge-neutral'}>
                          {isAr ? (ROLE_LABEL_AR[m.role] ?? m.role) : (ROLE_LABEL_EN[m.role] ?? m.role)}
                        </span>
                        <span className={m.is_active ? 'ds-badge ds-badge-ok' : 'ds-badge ds-badge-neutral'}>
                          {m.is_active ? t.active : t.inactive}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* System accounts (read-only) */}
          {nonDoctors.length > 0 && (
            <div>
              <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--txt3)', marginBottom: 12 }}>
                {isAr ? 'حسابات النظام' : 'System Accounts'}
              </h2>
              <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th className="ds-th">{t.name}</th>
                      <th className="ds-th">{t.phone}</th>
                      <th className="ds-th">{t.role}</th>
                      <th className="ds-th">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonDoctors.map((s: Profile) => (
                      <tr key={s.id} className="ds-tbody-row">
                        <td className="ds-td">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="ds-avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                              {s.full_name.split(' ').slice(0, 2).map((p: string) => p.charAt(0)).join('').toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{s.full_name}</span>
                          </div>
                        </td>
                        <td className="ds-td" style={{ fontSize: 13, color: 'var(--txt2)' }}>{s.phone ?? '—'}</td>
                        <td className="ds-td">
                          <span className={ROLE_CLS[s.role] ?? 'ds-badge ds-badge-neutral'}>{s.role}</span>
                        </td>
                        <td className="ds-td">
                          <span className={s.is_active ? 'ds-badge ds-badge-ok' : 'ds-badge ds-badge-neutral'}>
                            {s.is_active ? t.active : t.inactive}
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
        <DoctorModal doctor={doctorModal === 'new' ? null : doctorModal} isAr={isAr} onClose={() => setDoctorModal(null)} />
      )}
      {staffModal !== null && (
        <StaffMemberModal member={staffModal === 'new' ? null : staffModal} isAr={isAr} onClose={() => setStaffModal(null)} />
      )}
    </div>
  );
}
