import { useState } from 'react';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { usePatients } from '@/hooks/usePatients';
import { useDoctors } from '@/hooks/useStaff';

interface TreatmentPlan {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  patient: { first_name: string; last_name: string } | null;
  doctor: { full_name: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ON_HOLD: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function useTreatmentPlans() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  return useQuery({
    queryKey: ['treatment_plans', clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select(`
          *,
          patient:patients(first_name, last_name),
          doctor:profiles!treatment_plans_doctor_id_fkey(full_name)
        `)
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TreatmentPlan[];
    },
  });
}

function useCreateTreatmentPlan() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();
  return useMutation({
    mutationFn: async (values: { patient_id: string; doctor_id: string; title: string; description: string; start_date: string }) => {
      const { data, error } = await supabase
        .from('treatment_plans')
        .insert({
          ...values,
          clinic_id: profile!.clinic_id,
          created_by: profile!.id,
          status: 'ACTIVE',
          patient_id: values.patient_id || null,
          doctor_id: values.doctor_id || null,
          start_date: values.start_date || null,
          description: values.description || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['treatment_plans'] }),
  });
}

export function TreatmentsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', title: '', description: '', start_date: '' });

  const { data: plans = [], isLoading, error } = useTreatmentPlans();
  const { data: patients = [] } = usePatients('');
  const { data: doctors = [] } = useDoctors();
  const create = useCreateTreatmentPlan();

  const filtered = search.trim()
    ? plans.filter(p =>
        (p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : '').toLowerCase().includes(search.toLowerCase()) ||
        (p.title ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : plans;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync(form);
    setForm({ patient_id: '', doctor_id: '', title: '', description: '', start_date: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Treatment Plans</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{filtered.length} plans</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> New Plan
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm"
        >
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">New Treatment Plan</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Patient *</label>
              <select
                required
                value={form.patient_id}
                onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— Select patient —</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Doctor</label>
              <select
                value={form.doctor_id}
                onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— Select doctor —</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
            <input
              required
              placeholder="Plan title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <textarea
              placeholder="Description / notes"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 sm:col-span-2 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={create.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {create.isPending ? 'Saving...' : 'Save Plan'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
          </div>
          {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
        </form>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          placeholder="Search by patient or plan title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">{(error as Error).message}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">{search ? 'No plans found.' : 'No treatment plans yet.'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Patient</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Plan</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Doctor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Start Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(plan => (
                <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {plan.patient ? `${plan.patient.first_name} ${plan.patient.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{plan.title}</p>
                    {plan.description && <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">{plan.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{plan.doctor?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[plan.status ?? 'ACTIVE'] ?? 'bg-slate-100 text-slate-600'}`}>
                      {plan.status ?? 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                    {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
