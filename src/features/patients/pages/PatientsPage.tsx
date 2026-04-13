import { useState } from 'react';
import { Search, UserCheck, Download, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '@/hooks/usePatients';
import { PatientDetailModal } from '@/components/shared/PatientDetailModal';
import { exportToCsv } from '@/lib/exportCsv';
import { useT } from '@/lib/translations';
import { useHistoryStore } from '@/store/historyStore';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/types/supabase';

type Patient = Database['public']['Tables']['patients']['Row'];
type PatientInsert = Database['public']['Tables']['patients']['Insert'];

const emptyForm = {
  first_name: '',
  last_name: '',
  phone: '',
  gender: '' as '' | 'MALE' | 'FEMALE' | 'OTHER',
  dob: '',
  notes: '',
};

// ─── Patient Modal ────────────────────────────────────────────────────────────

function PatientModal({ patient, isAr, onClose }: { patient: Patient | null; isAr: boolean; onClose: () => void }) {
  const t = useT(isAr);
  const [form, setForm] = useState(
    patient
      ? {
          first_name: patient.first_name,
          last_name: patient.last_name,
          phone: patient.phone ?? '',
          gender: (patient.gender ?? '') as '' | 'MALE' | 'FEMALE' | 'OTHER',
          dob: patient.dob ?? '',
          notes: patient.notes ?? '',
        }
      : { ...emptyForm }
  );
  const [submitError, setSubmitError] = useState('');

  const create = useCreatePatient();
  const update = useUpdatePatient();
  const isPending = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const payload: Partial<PatientInsert> = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim() || null,
      gender: form.gender || null,
      dob: form.dob || null,
      notes: form.notes.trim() || null,
    };
    try {
      if (patient) {
        await update.mutateAsync({ id: patient.id, values: payload });
      } else {
        await create.mutateAsync(payload as Omit<PatientInsert, 'clinic_id' | 'created_by'>);
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : (isAr ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.'));
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 500 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {patient ? t.editPatient : t.addPatient}
          </span>
          <button className="ds-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{isAr ? 'الاسم الأول *' : 'First Name *'}</label>
              <input required className="ds-input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder={isAr ? 'أحمد' : 'Ahmed'} />
            </div>
            <div>
              <label className="ds-label">{isAr ? 'اسم العائلة *' : 'Last Name *'}</label>
              <input required className="ds-input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder={isAr ? 'حسن' : 'Hassan'} />
            </div>
          </div>

          <div>
            <label className="ds-label">{t.phone}</label>
            <input type="tel" className="ds-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{t.gender}</label>
              <select className="ds-input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as typeof form.gender }))}>
                <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
                <option value="MALE">{t.male}</option>
                <option value="FEMALE">{t.female}</option>
                <option value="OTHER">{isAr ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
            <div>
              <label className="ds-label">{t.dateOfBirth}</label>
              <input type="date" className="ds-input" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="ds-label">{t.notes}</label>
            <textarea
              className="ds-input"
              style={{ resize: 'none' }}
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder={isAr ? 'تنبيهات طبية، حساسية، أو ملاحظات أخرى...' : 'Medical alerts, allergies, or other notes...'}
            />
          </div>

          {submitError && <p className="ds-error">{submitError}</p>}

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="submit" disabled={isPending} className="ds-btn ds-btn-primary" style={{ flex: 1 }}>
              {isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : patient ? t.save : t.addPatient}
            </button>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-ghost">{t.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PatientsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);

  const { data: patients = [], isLoading, error } = usePatients(search);
  const deletePatient = useDeletePatient();
  const updatePatient = useUpdatePatient();
  const { pushAction } = useHistoryStore();
  const { can } = usePermissions();

  const errorMessage = error instanceof Error ? error.message : (isAr ? 'فشل تحميل المرضى.' : 'Failed to load patients.');

  const handleExport = () => {
    exportToCsv('patients', patients.map(p => ({
      'First Name': p.first_name,
      'Last Name': p.last_name,
      Phone: p.phone ?? '',
      Gender: p.gender ?? '',
      DOB: p.dob ?? '',
      'Created At': p.created_at,
    })));
  };

  const handleDelete = async (p: Patient) => {
    if (!confirm(`${isAr ? 'حذف المريض' : 'Delete patient'} "${p.first_name} ${p.last_name}"?`)) return;
    await deletePatient.mutateAsync(p.id);
    const name = `${p.first_name} ${p.last_name}`;
    pushAction({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: `Deleted patient: ${name}`,
      description_ar: `حُذف مريض: ${name}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      undo: async () => { await updatePatient.mutateAsync({ id: p.id, values: { deleted_at: null } as any }); },
      redo: async () => { await deletePatient.mutateAsync(p.id); },
    });
  };

  const openAdd = () => { setEditingPatient(null); setModalOpen(true); };
  const openEdit = (p: Patient) => { setEditingPatient(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingPatient(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>

      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span className="ds-badge ds-badge-p" style={{ fontSize: 12, padding: '4px 10px' }}>
            {patients.length} {isAr ? 'مريض' : 'patients'}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={handleExport} className="ds-btn ds-btn-ghost" style={{ gap: 6 }}>
            <Download size={14} /> {isAr ? 'تصدير CSV' : 'Export CSV'}
          </button>
          <button onClick={openAdd} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addPatient}
          </button>
        </div>

        <div style={{ marginTop: 14, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', pointerEvents: 'none' }} />
          <input
            placeholder={isAr ? 'بحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ds-search"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="ds-card" style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : error ? (
        <div className="ds-card" style={{ padding: 18, background: 'var(--err-soft)', border: '1px solid var(--err)', color: 'var(--err)' }}>
          {errorMessage}
        </div>
      ) : patients.length === 0 ? (
        <div className="ds-empty">
          <UserCheck size={40} style={{ color: 'var(--txt3)', marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>
            {search ? t.noPatientsFound : t.noPatientsFound}
          </p>
          <p style={{ fontSize: 13, color: 'var(--txt3)', marginBottom: 16 }}>
            {search ? (isAr ? 'جرب اسماً أو رقم هاتف آخر.' : 'Try another name or phone number.') : t.addFirstPatient}
          </p>
          {!search && (
            <button onClick={openAdd} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
              <Plus size={14} strokeWidth={2.5} /> {t.addPatient}
            </button>
          )}
        </div>
      ) : (
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th className="ds-th">{t.name}</th>
                <th className="ds-th">{t.phone}</th>
                <th className="ds-th">{t.gender}</th>
                <th className="ds-th">{t.dateOfBirth}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="ds-tbody-row">
                  <td className="ds-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="ds-avatar" style={{ width: 36, height: 36, fontSize: 12, flexShrink: 0 }}>
                        {p.first_name.charAt(0)}{p.last_name.charAt(0)}
                      </div>
                      <div>
                        <button
                          onClick={() => setDetailPatient(p)}
                          style={{ fontSize: 13, fontWeight: 600, color: 'var(--p2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
                        >
                          {p.first_name} {p.last_name}
                        </button>
                        {p.notes && (
                          <p style={{ fontSize: 11, color: 'var(--txt3)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="ds-td">
                    {p.phone ? (
                      <a href={`tel:${p.phone}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt2)', textDecoration: 'none' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--p2)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--txt2)'; }}
                      >
                        {p.phone}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--txt3)' }}>—</span>
                    )}
                  </td>
                  <td className="ds-td">
                    {p.gender ? (
                      <span className="ds-badge ds-badge-neutral">
                        {p.gender === 'MALE' ? t.male : p.gender === 'FEMALE' ? t.female : p.gender}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--txt3)' }}>—</span>
                    )}
                  </td>
                  <td className="ds-td" style={{ fontSize: 13, color: 'var(--txt2)' }}>
                    {p.dob ? new Date(p.dob).toLocaleDateString('en-EG', { dateStyle: 'medium' }) : '—'}
                  </td>
                  <td className="ds-td">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <button onClick={() => openEdit(p)} className="ds-icon-btn" title={t.edit}>
                        <Edit2 size={14} />
                      </button>
                      {can('delete:patient') && (
                        <button onClick={() => handleDelete(p)} className="ds-icon-btn-err" title={t.delete}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && <PatientModal patient={editingPatient} isAr={isAr} onClose={closeModal} />}
      <PatientDetailModal patient={detailPatient} onClose={() => setDetailPatient(null)} />
    </div>
  );
}
