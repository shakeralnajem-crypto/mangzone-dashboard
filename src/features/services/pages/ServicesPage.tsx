import { useState } from 'react';
import { Stethoscope, Plus, X, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAllServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/useServices';
import { useTranslation } from 'react-i18next';
import { useT } from '@/lib/translations';
import { formatEGP } from '@/lib/currency';
import type { Database } from '@/types/supabase';

type Service = Database['public']['Tables']['services']['Row'];

function ServiceModal({ service, isAr, onClose }: { service: Service | null; isAr: boolean; onClose: () => void }) {
  const t = useT(isAr);
  const isEdit = !!service;
  const [form, setForm] = useState({
    name: service?.name ?? '',
    category: service?.category ?? '',
    default_price: service ? String(service.default_price) : '',
    duration_minutes: service?.duration_minutes ? String(service.duration_minutes) : '',
    is_active: service?.is_active ?? true,
  });
  const [submitError, setSubmitError] = useState('');

  const create = useCreateService();
  const update = useUpdateService();
  const isPending = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const price = parseFloat(form.default_price);
    if (isNaN(price) || price < 0) {
      setSubmitError(isAr ? 'يجب أن يكون السعر رقماً صحيحاً.' : 'Price must be a valid number.');
      return;
    }
    const duration = form.duration_minutes ? parseInt(form.duration_minutes) : null;
    try {
      if (isEdit && service) {
        await update.mutateAsync({ id: service.id, name: form.name, category: form.category || null, default_price: price, duration_minutes: duration, is_active: form.is_active });
      } else {
        await create.mutateAsync({ name: form.name, category: form.category || null, default_price: price, duration_minutes: duration, is_active: form.is_active });
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : (isAr ? 'فشل حفظ الخدمة.' : 'Failed to save service.'));
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 440 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {isEdit ? t.editService : t.addService}
          </span>
          <button className="ds-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="ds-label">{t.name} *</label>
            <input
              required className="ds-input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={isAr ? 'مثال: تبييض الأسنان' : 'e.g. Teeth Whitening'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{t.category}</label>
              <input
                className="ds-input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder={isAr ? 'مثال: تجميلي' : 'e.g. Cosmetic'}
              />
            </div>
            <div>
              <label className="ds-label">{t.durationMin}</label>
              <input
                type="number" min="0" className="ds-input" value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                placeholder="60"
              />
            </div>
          </div>

          <div>
            <label className="ds-label">{t.defaultPrice} *</label>
            <input
              required type="number" min="0" step="0.01" className="ds-input" value={form.default_price}
              onChange={e => setForm(f => ({ ...f, default_price: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, border: '1px solid var(--brd)', padding: '10px 14px' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt2)' }}>
              {form.is_active ? t.active : t.inactive}
            </span>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.is_active ? 'var(--p2)' : 'var(--txt3)', display: 'flex' }}
            >
              {form.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>

          {submitError && <p className="ds-error">{submitError}</p>}

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="submit" disabled={isPending} className="ds-btn ds-btn-primary" style={{ flex: 1 }}>
              {isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isEdit ? t.save : t.addService}
            </button>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-ghost">{t.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ServicesPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [modalService, setModalService] = useState<Service | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: services = [], isLoading, error } = useAllServices();
  const update = useUpdateService();
  const remove = useDeleteService();

  const openAdd = () => { setModalService(null); setModalOpen(true); };
  const openEdit = (s: Service) => { setModalService(s); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const toggleActive = (s: Service) => update.mutate({ id: s.id, is_active: !s.is_active });

  const handleDelete = (s: Service) => {
    const msg = isAr
      ? `حذف خدمة "${s.name}"؟ لا يمكن التراجع.`
      : `Delete service "${s.name}"? This cannot be undone.`;
    if (!confirm(msg)) return;
    remove.mutate(s.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>

      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="ds-badge ds-badge-p" style={{ fontSize: 12, padding: '4px 10px' }}>
            {services.length} {t.servicesCount}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={openAdd} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addService}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="ds-card" style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : error ? (
        <div className="ds-card" style={{ padding: 18, background: 'var(--err-soft)', border: '1px solid var(--err)', color: 'var(--err)' }}>
          {(error as Error).message}
        </div>
      ) : services.length === 0 ? (
        <div className="ds-empty">
          <Stethoscope size={40} style={{ color: 'var(--txt3)', marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>{t.noServicesFound}</p>
          <p style={{ fontSize: 13, color: 'var(--txt3)', marginBottom: 16 }}>{t.addFirstService}</p>
          <button onClick={openAdd} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addService}
          </button>
        </div>
      ) : (
        <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th className="ds-th">{t.name}</th>
                <th className="ds-th">{t.category}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>{t.price}</th>
                <th className="ds-th">{t.duration}</th>
                <th className="ds-th">{t.status}</th>
                <th className="ds-th" style={{ textAlign: 'right' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} className="ds-tbody-row">
                  <td className="ds-td" style={{ fontWeight: 600, color: 'var(--txt)' }}>{s.name}</td>
                  <td className="ds-td">
                    {s.category ? (
                      <span className="ds-badge ds-badge-a">{s.category}</span>
                    ) : (
                      <span style={{ color: 'var(--txt3)' }}>—</span>
                    )}
                  </td>
                  <td className="ds-td" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--txt)' }}>
                    {formatEGP(s.default_price)}
                  </td>
                  <td className="ds-td" style={{ fontSize: 13, color: 'var(--txt2)' }}>
                    {s.duration_minutes ? `${s.duration_minutes} ${isAr ? 'دقيقة' : 'min'}` : '—'}
                  </td>
                  <td className="ds-td">
                    <span className={s.is_active ? 'ds-badge ds-badge-ok' : 'ds-badge ds-badge-neutral'}>
                      {s.is_active ? t.active : t.inactive}
                    </span>
                  </td>
                  <td className="ds-td">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <button
                        onClick={() => toggleActive(s)}
                        title={s.is_active ? (isAr ? 'تعطيل' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 7,
                          color: s.is_active ? 'var(--ok)' : 'var(--txt3)', display: 'flex',
                        }}
                      >
                        {s.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => openEdit(s)} className="ds-icon-btn"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(s)} className="ds-icon-btn-err"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && <ServiceModal service={modalService} isAr={isAr} onClose={closeModal} />}
    </div>
  );
}
