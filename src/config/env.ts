const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
  console.warn('[MANGZONE] VITE_SUPABASE_URL is not configured. Update .env.local');
}
if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.warn('[MANGZONE] VITE_SUPABASE_ANON_KEY is not configured. Update .env.local');
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
} as const;
