import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import type { Database } from '@/types/supabase';

type Patient = Database['public']['Tables']['patients']['Row'];

interface PatientSearchInputProps {
  value: string; // patient_id
  onChange: (id: string) => void;
  isAr?: boolean;
  placeholder?: string;
  required?: boolean;
  onQuickCreate?: (input: {
    first_name: string;
    last_name: string;
    phone?: string;
  }) => Promise<void> | void;
  quickCreateLoading?: boolean;
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function PatientSearchInput({
  value,
  onChange,
  isAr = false,
  placeholder,
  required,
  onQuickCreate,
  quickCreateLoading = false,
}: PatientSearchInputProps) {
  const [inputText, setInputText] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: patients = [], isLoading } = usePatients(query);

  // When value is cleared externally, reset internal state
  useEffect(() => {
    if (!value) {
      setSelectedPatient(null);
      setInputText('');
      setQuery('');
    }
  }, [value]);

  // Debounce search query
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(text.trim());
    }, 250);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(patient: Patient) {
    setSelectedPatient(patient);
    setInputText('');
    setQuery('');
    setOpen(false);
    onChange(patient.id);
  }

  function handleClear() {
    setSelectedPatient(null);
    setInputText('');
    setQuery('');
    setOpen(false);
    onChange('');
  }

  async function handleQuickCreate() {
    if (!onQuickCreate || quickCreateLoading) return;
    const raw = inputText.trim();
    if (!raw) return;

    const parts = raw.split(/\s+/).filter(Boolean);
    const first_name = parts[0] ?? '';
    const last_name = parts.slice(1).join(' ') || '-';

    await onQuickCreate({ first_name, last_name });
    setOpen(false);
  }

  const defaultPlaceholder = isAr
    ? 'ابحث بالاسم أو رقم الهاتف…'
    : 'Search by name or phone…';

  // Show selected patient name badge
  if (selectedPatient) {
    return (
      <div className="ds-input flex items-center gap-2 cursor-default select-none min-h-[38px]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold shrink-0">
          {getInitials(selectedPatient.first_name, selectedPatient.last_name)}
        </span>
        <span className="flex-1 text-sm text-slate-800 dark:text-slate-200 truncate">
          {selectedPatient.first_name} {selectedPatient.last_name}
          {selectedPatient.phone && (
            <span className="ms-1 text-slate-400 text-xs">
              · {selectedPatient.phone}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label={isAr ? 'مسح' : 'Clear'}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={14}
          className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          className="ds-input ps-8 pe-3 w-full"
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? defaultPlaceholder}
          required={required && !value}
          autoComplete="off"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">
              {isAr ? 'جاري البحث…' : 'Searching…'}
            </div>
          ) : patients.length === 0 ? (
            <div>
              <div className="px-4 py-3 text-sm text-slate-400 text-center">
                {isAr ? 'لا توجد نتائج' : 'No results found'}
              </div>
              {onQuickCreate && inputText.trim() && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    void handleQuickCreate();
                  }}
                  disabled={quickCreateLoading}
                  className="w-full text-start px-4 py-2 text-sm border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {quickCreateLoading
                    ? isAr
                      ? 'جاري إنشاء المريض...'
                      : 'Creating patient...'
                    : isAr
                      ? `إنشاء مريض جديد: "${inputText.trim()}"`
                      : `Create new patient: "${inputText.trim()}"`}
                </button>
              )}
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {patients.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-start"
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent input blur before select
                      handleSelect(patient);
                    }}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-[11px] font-bold">
                      {getInitials(patient.first_name, patient.last_name)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {patient.first_name} {patient.last_name}
                      </span>
                      {patient.phone && (
                        <span className="block text-xs text-slate-400 truncate">
                          {patient.phone}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
