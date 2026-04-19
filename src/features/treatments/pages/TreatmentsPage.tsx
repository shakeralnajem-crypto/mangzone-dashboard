import { useState } from 'react';
import { ClipboardList, Plus, Search, X, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useT, getStatusLabel } from '@/lib/translations';
import { usePermissions } from '@/hooks/usePermissions';
import { usePatients } from '@/hooks/usePatients';
import { useDoctors } from '@/hooks/useStaff';
import {
  useTreatmentPlans,
  useCreateTreatmentPlan,
  useUpdateTreatmentPlan,
  useDeleteTreatmentPlan,
  type TreatmentPlan,
} from '@/hooks/useTreatments';

const STATUS_CLS: Record<string, string> = {
  PLANNED:     'ds-badge ds-badge-a',
  IN_PROGRESS: 'ds-badge ds-badge-ok',
  COMPLETED:   'ds-badge ds-badge-neutral',
  CANCELLED:   'ds-badge ds-badge-err',
};

const STATUS_OPTIONS = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  plan, isAr, patients, doctors, onClose,
}: {
  plan: TreatmentPlan;
  isAr: boolean;
  patients: { id: string; first_name: string; last_name: string }[];
  doctors: { id: string; full_name: string }[];
  onClose: () => void;
}) {
  const t = useT(isAr);
  const update = useUpdateTreatmentPlan();
  const [form, setForm] = useState({
    patient_id: plan.patient_id ?? '',
    doctor_id:  plan.doctor_id  ?? '',
    title:      plan.title      ?? plan.name ?? '',
    status:     plan.status     ?? 'PLANNED',
    start_date: plan.start_date ?? '',
  });
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await update.mutateAsync({
        id: plan.id,
        patient_id: form.patient_id || null,
        doctor_id:  form.doctor_id  || null,
        title:      form.title,
        status:     form.status,
        start_date: form.start_date || null,
      });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 500 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>{t.editTreatment}</span>
          <button className="ds-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{t.patient}</label>
              <select className="ds-input" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
                <option value="">{t.selectPatient}</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="ds-label">{t.doctor}</label>
              <select className="ds-input" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
                <option value="">{t.selectDoctor}</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="ds-label">{t.treatmentName} *</label>
              <input required className="ds-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="ds-label">{t.status}</label>
              <select className="ds-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{getStatusLabel(s, isAr)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ds-label">{t.startDate}</label>
              <input type="date" className="ds-input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
          </div>
          {err && <p className="ds-error">{err}</p>}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="submit" disabled={update.isPending} className="ds-btn ds-btn-primary" style={{ flex: 1 }}>
              {update.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : t.save}
            </button>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-ghost">{t.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TreatmentsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', title: '', start_date: '' });

  const { data: plans = [], isLoading, error } = useTreatmentPlans();
  const { data: patients = [] } = usePatients('');
  const { data: doctors = [] } = useDoctors();
  const create = useCreateTreatmentPlan();
  const remove = useDeleteTreatmentPlan();
  const { can } = usePermissions();

  const filtered = search.trim()
    ? plans.filter(p =>
        (p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : '').toLowerCase().includes(search.toLowerCase()) ||
        (p.title ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : plans;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync(form);
    setForm({ patient_id: '', doctor_id: '', title: '', start_date: '' });
    setShowForm(false);
  };

  const handleDelete = (plan: TreatmentPlan) => {
    const msg = isAr
      ? `حذف خطة "${plan.title}"؟ لا يمكن التراجع.`
      : `Delete plan "${plan.title}"? This cannot be undone.`;
    if (!confirm(msg)) return;
    remove.mutate(plan.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease' }}>

      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="ds-badge ds-badge-p" style={{ fontSize: 12, padding: '4px 10px' }}>
            {filtered.length} {isAr ? 'خطة' : 'plans'}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowForm(v => !v)} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addTreatment}
          </button>
        </div>

        <div style={{ marginTop: 14, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', pointerEvents: 'none' }} />
          <input
            placeholder={isAr ? 'بحث بالمريض أو اسم الخطة...' : 'Search by patient or plan title...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ds-search"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="ds-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{t.addTreatment}</span>
            <button className="ds-modal-close" onClick={() => setShowForm(false)}><X size={15} /></button>
          </div>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="ds-label">{t.patient} *</label>
                <select required className="ds-input" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
                  <option value="">{t.selectPatient}</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="ds-label">{t.doctor}</label>
                <select className="ds-input" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
                  <option value="">{t.selectDoctor}</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="ds-label">{t.treatmentName} *</label>
                <input required className="ds-input" placeholder={isAr ? 'مثال: علاج تقويمي' : 'e.g. Orthodontic Treatment'} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="ds-label">{t.startDate}</label>
                <input type="date" className="ds-input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
            </div>
            {create.isError && <p className="ds-error">{(create.error as Error).message}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={create.isPending} className="ds-btn ds-btn-primary">
                {create.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : t.save}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="ds-btn ds-btn-ghost">{t.cancel}</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="ds-card" style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : error ? (
        <div className="ds-card" style={{ padding: 18, background: 'var(--err-soft)', border: '1px solid var(--err)', color: 'var(--err)' }}>
          {(error as Error).message}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ds-empty">
          <ClipboardList size={40} style={{ color: 'var(--txt3)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--txt3)' }}>{t.noTreatmentsFound}</p>
        </div>
      ) : (
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th className="ds-th">{t.patient}</th>
                <th className="ds-th">{isAr ? 'الخطة' : 'Plan'}</th>
                <th className="ds-th">{t.doctor}</th>
                <th className="ds-th">{t.status}</th>
                <th className="ds-th">{t.startDate}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(plan => (
                <tr key={plan.id} className="ds-tbody-row">
                  <td className="ds-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
                    {plan.patient ? `${plan.patient.first_name} ${plan.patient.last_name}` : '—'}
                  </td>
                  <td className="ds-td" style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
                    {plan.title ?? plan.name ?? '—'}
                  </td>
                  <td className="ds-td" style={{ fontSize: 13, color: 'var(--txt2)' }}>
                    {plan.doctor_id ? (doctors.find(d => d.id === plan.doctor_id)?.full_name ?? '—') : '—'}
                  </td>
                  <td className="ds-td">
                    <span className={STATUS_CLS[plan.status ?? 'PLANNED'] ?? 'ds-badge ds-badge-neutral'}>
                      {getStatusLabel(plan.status ?? 'PLANNED', isAr)}
                    </span>
                  </td>
                  <td className="ds-td" style={{ fontSize: 12, color: 'var(--txt3)' }}>
                    {plan.start_date ? new Date(plan.start_date).toLocaleDateString('en-EG') : '—'}
                  </td>
                  <td className="ds-td">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <button onClick={() => setEditingPlan(plan)} className="ds-icon-btn">
                        <Edit2 size={14} />
                      </button>
                      {can('delete:treatment') && (
                        <button onClick={() => handleDelete(plan)} className="ds-icon-btn-err">
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

      {editingPlan && (
        <EditModal
          plan={editingPlan}
          isAr={isAr}
          patients={patients}
          doctors={doctors}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </div>
  );
}
