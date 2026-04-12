import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/supabase';

type ContentPost = Database['public']['Tables']['content_posts']['Row'];
type ContentPostInsert = Database['public']['Tables']['content_posts']['Insert'];
type ContentPostUpdate = Database['public']['Tables']['content_posts']['Update'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useContentPosts(filters?: { status?: string; month?: number; year?: number }) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['content_posts', clinicId, filters],
    enabled: !!clinicId,
    queryFn: async () => {
      let q = db
        .from('content_posts')
        .select('*')
        .eq('clinic_id', clinicId!)
        .order('scheduled_date', { ascending: true });

      if (filters?.status && filters.status !== 'ALL') {
        q = q.eq('status', filters.status);
      }

      if (filters?.year && filters?.month) {
        const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
        const end = new Date(filters.year, filters.month, 0).toISOString().slice(0, 10);
        q = q.gte('scheduled_date', start).lte('scheduled_date', end);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as ContentPost[];
    },
  });
}

export function useCreateContentPost() {
  const qc = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (values: Omit<ContentPostInsert, 'clinic_id' | 'created_by'>) => {
      const { data, error } = await db
        .from('content_posts')
        .insert({ ...values, clinic_id: profile!.clinic_id, created_by: profile!.id })
        .select()
        .single();
      if (error) throw error;
      return data as ContentPost;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content_posts'] }),
  });
}

export function useUpdateContentPost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...values }: ContentPostUpdate & { id: string }) => {
      const { error } = await db
        .from('content_posts')
        .update(values)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content_posts'] }),
  });
}

export function useDeleteContentPost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('content_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content_posts'] }),
  });
}
