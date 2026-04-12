import { useState } from 'react';
import { Search, UserCheck, Download, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '@/hooks/usePatients';
import { PatientDetailModal } from '@/components/shared/PatientDetailModal';
import { exportToCsv } from '@/lib/exportCsv';
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

interface PatientModalProps {
  patient: Patient | null;
  onClose: () => void;
}

function PatientModal({ patient, onClose }: PatientModalProps) {
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
      setSubmitError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    }
  };

  const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {patient ? 'Edit Patient' : 'Add New Patient'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                First Name *
              </label>
              <input
                required
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className={field}
                placeholder="Ahmed"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Last Name *
              </label>
              <input
                required
                value={form.last_name}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                className={field}
                placeholder="Hassan"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className={field}
              placeholder="01xxxxxxxxx"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value as typeof form.gender }))}
                className={field}
              >
                <option value="">— Select —</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                className={field}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              className={`${field} resize-none`}
              placeholder="Medical alerts, allergies, or other notes..."
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
              {isPending ? 'Saving...' : patient ? 'Save Changes' : 'Add Patient'}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);

  const { data: patients = [], isLoading, error } = usePatients(search);
  const deletePatient = useDeletePatient();

  const errorMessage = error instanceof Error ? error.message : 'Failed to load patients.';

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
    if (!confirm(`Delete patient "${p.first_name} ${p.last_name}"? This cannot be undone.`)) return;
    await deletePatient.mutateAsync(p.id);
  };

  const openAdd = () => { setEditingPatient(null); setModalOpen(true); };
  const openEdit = (p: Patient) => { setEditingPatient(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingPatient(null); };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Patients</h1>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {patients.length} total
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Search the patient directory by full name or phone number.
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
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add Patient
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </div>
      ) : patients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <UserCheck className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-base font-medium text-slate-700 dark:text-slate-200">
            {search ? 'No patients found.' : 'No patients yet.'}
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            {search ? 'Try another name or phone number.' : 'Click "Add Patient" to get started.'}
          </p>
          {!search && (
            <button
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add Patient
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Gender
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Date of Birth
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {patients.map(p => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-sm font-semibold text-brand-700 dark:from-brand-900/40 dark:to-brand-800/40 dark:text-brand-300">
                        {p.first_name.charAt(0)}{p.last_name.charAt(0)}
                      </div>
                      <div>
                        <button
                          onClick={() => setDetailPatient(p)}
                          className="font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300 text-left transition-colors"
                        >
                          {p.first_name} {p.last_name}
                        </button>
                        {p.notes && (
                          <p className="max-w-xs truncate text-xs text-slate-400 dark:text-slate-500">
                            {p.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {p.phone ? (
                      <a
                        href={`tel:${p.phone}`}
                        className="font-medium text-slate-700 transition hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-400"
                      >
                        {p.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {p.gender ? (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {p.gender}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {p.dob ? new Date(p.dob).toLocaleDateString('en-EG', { dateStyle: 'medium' }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        title="Edit patient"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        title="Delete patient"
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
        <PatientModal patient={editingPatient} onClose={closeModal} />
      )}

      <PatientDetailModal
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
      />
    </div>
  );
}
