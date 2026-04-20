import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useNewLeadsCount() {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['new-leads-count', clinicId],
    enabled: !!clinicId,
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count } = await db
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .eq('status', 'NEW');
      return count ?? 0;
    },
  });
}
