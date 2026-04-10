import { useState } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const { data: patients = [], isLoading, error } = usePatients(search);
  const errorMessage = error instanceof Error ? error.message : 'Failed to load patients.';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
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

          <div className="w-full lg:max-w-md">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search by name or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

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
            {search ? 'Try another name or phone number.' : 'Patients will appear here once they are added.'}
          </p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {patients.map(p => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {p.first_name.charAt(0)}
                        {p.last_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Patient record
                        </p>
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
                      <span className="text-slate-400 dark:text-slate-500">No phone on file</span>
                    )}
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
