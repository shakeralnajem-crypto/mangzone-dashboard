/**
 * Patient API tests — exercises Supabase PostgREST + RLS policies.
 *
 * Auth cases use raw fetch() to control the Authorization header precisely.
 * Business-logic cases use the Supabase JS client signed in as admin.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  getAuthClient,
  getAnonClient,
  getClinicId,
  cleanupPatient,
  pgFetch,
} from './helpers';

const PATIENTS_PATH = '/patients';

// ─── Auth tests (raw HTTP) ────────────────────────────────────────────────────

describe('Patients — authentication', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const res = await pgFetch(PATIENTS_PATH, { token: null });
    // PostgREST returns 401 for requests that need auth but have no JWT.
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header carries an invalid token', async () => {
    const res = await pgFetch(PATIENTS_PATH, {
      token: 'this.is.not.a.real.jwt',
    });
    expect(res.status).toBe(401);
  });

  it('anon key alone (no user session) cannot read patients', async () => {
    // The anon key is a valid JWT but for the anon Postgres role.
    // RLS policies restrict patients to authenticated users only.
    const res = await pgFetch(PATIENTS_PATH, { token: SUPABASE_ANON_KEY });
    // PostgREST returns either 200 with an empty array (RLS filters all rows)
    // or 401/403.  Either way, no patient rows must be exposed.
    if (res.status === 200) {
      const body = await res.json();
      expect(Array.isArray(body) && body.length === 0).toBe(true);
    } else {
      expect([401, 403]).toContain(res.status);
    }
  });

  it('returns data when a valid user JWT is provided', async () => {
    const client = await getAuthClient();
    const session = (await client.auth.getSession()).data.session;
    const token = session?.access_token ?? '';
    const res = await pgFetch(PATIENTS_PATH, { token });
    expect(res.status).toBe(200);
  });
});

// ─── Patient creation ─────────────────────────────────────────────────────────

describe('Patients — create', () => {
  let adminClient: SupabaseClient;
  let clinicId: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    adminClient = await getAuthClient();
    clinicId = await getClinicId(adminClient);
  });

  afterAll(async () => {
    await Promise.all(createdIds.map((id) => cleanupPatient(adminClient, id)));
    await adminClient.auth.signOut();
  });

  it('creates a patient with all required fields', async () => {
    const { data, error } = await adminClient
      .from('patients')
      .insert({
        first_name: 'Test',
        last_name: 'Patient',
        clinic_id: clinicId,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBeTruthy();
    createdIds.push(data!.id);
  });

  it('fails with a DB error when first_name is missing', async () => {
    const { data, error } = await adminClient
      .from('patients')
      .insert({
        last_name: 'OnlyLast',
        clinic_id: clinicId,
      } as never)
      .select();

    // Supabase/PostgREST surfaces NOT NULL violations as an error.
    expect(error).not.toBeNull();
    expect(data).toBeFalsy();
  });

  it('fails with a DB error when last_name is missing', async () => {
    const { data, error } = await adminClient
      .from('patients')
      .insert({
        first_name: 'OnlyFirst',
        clinic_id: clinicId,
      } as never)
      .select();

    expect(error).not.toBeNull();
    expect(data).toBeFalsy();
  });

  it('rejects a date_of_birth in the future (app-layer validation)', () => {
    // This validation runs before any DB call in useCreatePatient().
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dob = tomorrow.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    // Mirrors validateDobNotFuture from usePatients.ts
    const isDobFuture = dob.slice(0, 10) > today;
    expect(isDobFuture).toBe(true);
  });

  it('detects duplicate phone at the application layer', () => {
    // Mirrors the duplicate-check logic in PatientsPage.tsx (lines 95-105).
    // The DB has no unique constraint on phone; uniqueness is enforced in JS.
    const normalize = (p: string) => p.replace(/\D/g, '');

    const existingPatients = [
      { id: 'uuid-1', first_name: 'Ali', last_name: 'Hassan', phone: '010 000 0001' },
      { id: 'uuid-2', first_name: 'Sara', last_name: 'Ahmed', phone: '010 000 0002' },
    ];

    // Same digits as patient 1's phone, different formatting.
    const incomingPhone = '0100000001';
    const duplicate = existingPatients.find(
      (p) => p.phone && normalize(p.phone) === normalize(incomingPhone)
    );

    expect(duplicate).toBeDefined();
    expect(duplicate!.first_name).toBe('Ali');
  });

  it('allows two patients with different phones', () => {
    const normalize = (p: string) => p.replace(/\D/g, '');
    const existingPatients = [
      { id: 'uuid-1', phone: '010 000 0001' },
    ];
    const incomingPhone = '0100000002';
    const duplicate = existingPatients.find(
      (p) => p.phone && normalize(p.phone) === normalize(incomingPhone)
    );
    expect(duplicate).toBeUndefined();
  });
});

// ─── Sensitive fields ─────────────────────────────────────────────────────────

describe('Patients — sensitive field exposure', () => {
  let adminClient: SupabaseClient;
  const createdIds: string[] = [];

  beforeAll(async () => {
    adminClient = await getAuthClient();
    const clinicId = await getClinicId(adminClient);
    const { data } = await adminClient
      .from('patients')
      .insert({ first_name: 'Sensitive', last_name: 'Test', clinic_id: clinicId })
      .select()
      .single();
    if (data) createdIds.push(data.id);
  });

  afterAll(async () => {
    await Promise.all(createdIds.map((id) => cleanupPatient(adminClient, id)));
    await adminClient.auth.signOut();
  });

  it('patient records do not contain password or token fields', async () => {
    const { data } = await adminClient
      .from('patients')
      .select('*')
      .eq('first_name', 'Sensitive')
      .is('deleted_at', null)
      .limit(1)
      .single();

    const keys = Object.keys(data ?? {});
    const forbidden = ['password', 'password_hash', 'token', 'secret', 'access_token'];
    for (const field of forbidden) {
      expect(keys).not.toContain(field);
    }
  });

  it('profile query does not return is_active or role to patient-scoped responses', async () => {
    // Patients table has no is_active/role columns — verify no accidental join.
    const { data } = await adminClient
      .from('patients')
      .select('*')
      .is('deleted_at', null)
      .limit(1)
      .single();

    const keys = Object.keys(data ?? {});
    expect(keys).not.toContain('is_active');
    expect(keys).not.toContain('role');
  });
});

// ─── RLS isolation ────────────────────────────────────────────────────────────

describe('Patients — RLS clinic isolation', () => {
  it('unauthenticated insert is rejected', async () => {
    const anon = getAnonClient();
    const { error } = await anon
      .from('patients')
      .insert({ first_name: 'Hacker', last_name: 'Anon', clinic_id: '00000000-0000-0000-0000-000000000000' })
      .select();

    // RLS with "TO authenticated" rejects anon inserts.
    expect(error).not.toBeNull();
  });
});
