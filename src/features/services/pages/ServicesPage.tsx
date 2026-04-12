import { useState } from 'react';
import { Stethoscope, Plus, X, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAllServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/useServices';
import { formatEGP } from '@/lib/currency';
import type { Database } from '@/types/supabase';

type Service = Database['public']['Tables']['services']['Row'];

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

interface ServiceModalProps {
  service: Service | null;
  onClose: () => void;
}

function ServiceModal({ service, onClose }: ServiceModalProps) {
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
    if (isNaN(price) || price < 0) { setSubmitError('Price must be a valid number.'); return; }
    const duration = form.duration_minutes ? parseInt(form.duration_minutes) : null;
    try {
      if (isEdit && service) {
        await update.mutateAsync({
          id: service.id,
          name: form.name,
          category: form.category || null,
          default_price: price,
          duration_minutes: duration,
          is_active: form.is_active,
        });
      } else {
        await create.mutateAsync({
          name: form.name,
          category: form.category || null,
          default_price: price,
          duration_minutes: duration,
          is_active: form.is_active,
        });
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save service.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Service' : 'Add Service'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={fieldClass} placeholder="e.g. Teeth Whitening" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={fieldClass} placeholder="e.g. Cosmetic" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Duration (min)</label>
              <input type="number" min="0" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} className={fieldClass} placeholder="60" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Default Price (EGP) *</label>
            <input required type="number" min="0" step="0.01" value={form.default_price} onChange={e => setForm(f => ({ ...f, default_price: e.target.value }))} className={fieldClass} placeholder="0.00" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</span>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`transition-colors ${form.is_active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-300 dark:text-slate-600'}`}
            >
              {form.is_active ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
            </button>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{submitError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isPending}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Service'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ServicesPage() {
  const [modalService, setModalService] = useState<Service | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: services = [], isLoading, error } = useAllServices();
  const update = useUpdateService();
  const remove = useDeleteService();

  const openAdd = () => { setModalService(null); setModalOpen(true); };
  const openEdit = (s: Service) => { setModalService(s); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const toggleActive = (s: Service) => {
    update.mutate({ id: s.id, is_active: !s.is_active });
  };

  const handleDelete = (s: Service) => {
    if (!confirm(`حذف خدمة "${s.name}"؟ لا يمكن التراجع.`)) return;
    remove.mutate(s.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Services</h1>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {services.length} total
            </span>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage clinic services, pricing, and availability.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {(error as Error).message}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Stethoscope className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-base font-medium text-slate-700 dark:text-slate-200">No services yet.</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Add your first service to get started.</p>
          <button onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {services.map(s => (
                <tr key={s.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{s.category ?? '—'}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">{formatEGP(s.default_price)}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {s.duration_minutes ? `${s.duration_minutes} min` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(s)}
                        title={s.is_active ? 'Deactivate' : 'Activate'}
                        className={`rounded-lg p-2 transition-colors ${s.is_active ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                        {s.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
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
        <ServiceModal
          service={modalService}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
