import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://siakmpxppflfbfhmbmta.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYWttcHhwcGZsZmJmaG1ibXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDk4MzIsImV4cCI6MjA5MTM4NTgzMn0.7Ps8w5ceGHdryymcz53AM2Fk5DUr_Q-dPQNGSXY5bVI';

export const TEST_EMAIL = 'admin@test.com';
export const TEST_PASSWORD = '12345678';

/** Authenticated client shared across tests in a suite. */
export async function getAuthClient(): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) throw new Error(`Auth failed: ${error.message}`);
  return client;
}

/** Unauthenticated anon client — no user session. */
export function getAnonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Raw PostgREST fetch helper.
 *
 * token: null    → omit BOTH apikey and Authorization (no JWT at all → 401)
 * token: 'bad'   → send apikey + Authorization: Bearer bad (invalid JWT → 401)
 * token: '<jwt>' → send apikey + Authorization: Bearer <jwt> (authenticated)
 *
 * Supabase treats the apikey header as the JWT for the anon role.
 * To get a true 401 we must omit both headers entirely.
 */
export async function pgFetch(
  path: string,
  options: {
    method?: string;
    token: string | null;
    body?: unknown;
  }
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
  if (options.token !== null) {
    headers['apikey'] = SUPABASE_ANON_KEY;
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

/** Returns the clinic_id from the authenticated user's profile. */
export async function getClinicId(client: SupabaseClient): Promise<string> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) throw new Error('No authenticated user');
  const { data, error } = await client
    .from('profiles')
    .select('clinic_id')
    .eq('id', user.user.id)
    .single();
  if (error || !data?.clinic_id) throw new Error('Could not fetch clinic_id');
  return data.clinic_id;
}

/** Soft-delete a patient by id using the admin client. */
export async function cleanupPatient(
  client: SupabaseClient,
  id: string
): Promise<void> {
  await client
    .from('patients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
}

/** Soft-delete an appointment by id using the admin client. */
export async function cleanupAppointment(
  client: SupabaseClient,
  id: string
): Promise<void> {
  await client
    .from('appointments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
}
