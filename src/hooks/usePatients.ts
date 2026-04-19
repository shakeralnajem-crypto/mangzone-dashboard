import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type Patient = Database['public']['Tables']['patients']['Row'];
type PatientInsert = Database['public']['Tables']['patients']['Insert'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function toAppError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return new Error(error.message);
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message
  ) {
    return new Error(error.message);
  }

  return new Error(fallback);
}

export function usePatients(search = '') {
  const authLoading = useAuthStore((s) => s.isLoading);
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  const normalizedSearch = search.trim();

  return useQuery({
    queryKey: ['patients', clinicId ?? null, normalizedSearch],
    // Both guards required:
    // - !authLoading: prevents firing before session restore completes
    // - !!clinicId:   prevents firing (and caching []) when profile is absent
    enabled: !authLoading && !!clinicId,
    queryFn: async (): Promise<Patient[]> => {
      // clinicId is guaranteed non-null here by the enabled guard above,
      // but keep the check as a safety net for TypeScript narrowing.
      if (!clinicId) {
        return [];
      }

      try {
        let query = db
          .from('patients')
          .select('*')
          .eq('clinic_id', clinicId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(500);

        if (normalizedSearch) {
          query = query.or(
            `first_name.ilike.%${normalizedSearch}%,last_name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        return data ?? [];
      } catch (error) {
        throw toAppError(error, 'Failed to load patients.');
      }
    },
  });
}

function validateDobNotFuture(dob?: string | null) {
  if (!dob) return;
  const value = dob.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  if (value > today) {
    throw new Error('Date of birth cannot be in the future.');
  }
}

export function useCreatePatient() {
  const qc = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: async (
      values: Omit<PatientInsert, 'clinic_id' | 'created_by'>
    ): Promise<Patient> => {
      if (!profile?.clinic_id || !profile.id) {
        throw new Error('Missing clinic context for creating a patient.');
      }

      try {
        validateDobNotFuture(values.dob ?? null);

        const { data, error } = await db
          .from('patients')
          .insert({
            ...values,
            clinic_id: profile.clinic_id,
            created_by: profile.id,
          })
          .select();

        if (error) {
          throw error;
        }

        const patient = data?.[0];

        if (!patient) {
          throw new Error('Patient was created but no record was returned.');
        }

        return patient as Patient;
      } catch (error) {
        throw toAppError(error, 'Failed to create patient.');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<PatientInsert>;
    }) => {
      try {
        if (Object.prototype.hasOwnProperty.call(values, 'dob')) {
          validateDobNotFuture(values.dob ?? null);
        }

        const { data, error } = await db
          .from('patients')
          .update(values)
          .eq('id', id)
          .select();
        if (error) throw error;
        return data?.[0] as Patient;
      } catch (error) {
        throw toAppError(error, 'Failed to update patient.');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await db
          .from('patients')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          throw error;
        }
      } catch (error) {
        throw toAppError(error, 'Failed to delete patient.');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}
