/**
 * Appointment API tests — exercises Supabase PostgREST + RLS policies.
 *
 * Auth cases use raw fetch() to control the Authorization header precisely.
 * Business-logic cases use the Supabase JS client signed in as admin.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  SUPABASE_ANON_KEY,
  getAuthClient,
  getAnonClient,
  getClinicId,
  cleanupAppointment,
  cleanupPatient,
  pgFetch,
} from './helpers';

const APPOINTMENTS_PATH = '/appointments';

// ─── Auth tests (raw HTTP) ────────────────────────────────────────────────────

describe('Appointments — authentication', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const res = await pgFetch(APPOINTMENTS_PATH, { token: null });
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header carries an invalid token', async () => {
    const res = await pgFetch(APPOINTMENTS_PATH, {
      token: 'totally.fake.jwt',
    });
    expect(res.status).toBe(401);
  });

  it('anon key alone cannot read appointments', async () => {
    const res = await pgFetch(APPOINTMENTS_PATH, { token: SUPABASE_ANON_KEY });
    if (res.status === 200) {
      const body = await res.json();
      expect(Array.isArray(body) && body.length === 0).toBe(true);
    } else {
      expect([401, 403]).toContain(res.status);
    }
  });
});

// ─── Time validation (app layer) ──────────────────────────────────────────────

describe('Appointments — time validation (app layer)', () => {
  // Mirrors validateAppointmentTimeRange from useAppointments.ts (lines 24-34).

  function validateTimeRange(start_time: string, end_time: string): string | null {
    const start = new Date(start_time).getTime();
    const end = new Date(end_time).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 'Invalid appointment time.';
    if (end <= start) return 'Appointment end time must be after start time.';
    return null;
  }

  it('rejects when end_time equals start_time', () => {
    const t = '2026-05-01T10:00:00.000Z';
    expect(validateTimeRange(t, t)).toBe('Appointment end time must be after start time.');
  });

  it('rejects when end_time is before start_time', () => {
    const start = '2026-05-01T10:00:00.000Z';
    const end = '2026-05-01T09:00:00.000Z';
    expect(validateTimeRange(start, end)).toBe('Appointment end time must be after start time.');
  });

  it('rejects non-ISO date strings', () => {
    expect(validateTimeRange('not-a-date', '2026-05-01T10:00:00.000Z')).toBe(
      'Invalid appointment time.'
    );
  });

  it('accepts a valid time range', () => {
    const start = '2026-05-01T10:00:00.000Z';
    const end = '2026-05-01T10:30:00.000Z';
    expect(validateTimeRange(start, end)).toBeNull();
  });
});

// ─── Duplicate appointment (app layer) ───────────────────────────────────────

describe('Appointments — duplicate detection (app layer)', () => {
  /**
   * Mirrors the duplicate check added in commit f567715:
   *   "block submit if the selected patient already has a non-cancelled
   *    appointment at the same start time (epoch-ms comparison)"
   */
  function hasDuplicate(
    existingAppointments: Array<{ patient_id: string | null; start_time: string; status: string }>,
    newPatientId: string,
    newStartTime: string,
    editingId?: string
  ): boolean {
    const newEpoch = new Date(newStartTime).getTime();
    return existingAppointments.some(
      (a) =>
        a.patient_id === newPatientId &&
        a.status !== 'CANCELLED' &&
        new Date(a.start_time).getTime() === newEpoch &&
        a !== existingAppointments.find((x) => x === a && editingId)
    );
  }

  const PATIENT_ID = 'patient-uuid-1';
  const START_TIME = '2026-05-01T10:00:00.000Z';

  const existing = [
    { patient_id: PATIENT_ID, start_time: START_TIME, status: 'SCHEDULED' },
  ];

  it('detects a duplicate when same patient has a non-cancelled appointment at same time', () => {
    expect(hasDuplicate(existing, PATIENT_ID, START_TIME)).toBe(true);
  });

  it('does not flag a CANCELLED appointment as a duplicate', () => {
    const withCancelled = [{ patient_id: PATIENT_ID, start_time: START_TIME, status: 'CANCELLED' }];
    expect(hasDuplicate(withCancelled, PATIENT_ID, START_TIME)).toBe(false);
  });

  it('does not flag a different patient at the same time as a duplicate', () => {
    expect(hasDuplicate(existing, 'patient-uuid-2', START_TIME)).toBe(false);
  });

  it('does not flag the same patient at a different time as a duplicate', () => {
    const differentTime = '2026-05-01T11:00:00.000Z';
    expect(hasDuplicate(existing, PATIENT_ID, differentTime)).toBe(false);
  });

  it('uses epoch comparison — handles ISO format differences for the same moment', () => {
    // Supabase may return e.g. "2026-05-01T10:00:00+00:00" vs "2026-05-01T10:00:00.000Z"
    const withTzOffset = [
      { patient_id: PATIENT_ID, start_time: '2026-05-01T10:00:00+00:00', status: 'SCHEDULED' },
    ];
    expect(hasDuplicate(withTzOffset, PATIENT_ID, START_TIME)).toBe(true);
  });
});

// ─── Required fields (DB layer) ───────────────────────────────────────────────

describe('Appointments — required fields', () => {
  let adminClient: SupabaseClient;
  let clinicId: string;
  let testPatientId: string;

  beforeAll(async () => {
    adminClient = await getAuthClient();
    clinicId = await getClinicId(adminClient);

    // Create a patient to link appointments to.
    const { data } = await adminClient
      .from('patients')
      .insert({ first_name: 'ApptTest', last_name: 'Patient', clinic_id: clinicId })
      .select()
      .single();
    testPatientId = data!.id;
  });

  afterAll(async () => {
    await cleanupPatient(adminClient, testPatientId);
    await adminClient.auth.signOut();
  });

  it('fails when start_time is missing', async () => {
    const { data, error } = await adminClient
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        patient_id: testPatientId,
        end_time: '2026-05-01T10:30:00.000Z',
        status: 'SCHEDULED',
      } as never)
      .select();

    expect(error).not.toBeNull();
    expect(data).toBeFalsy();
  });

  it('creates a valid appointment with start_time, end_time, and clinic_id', async () => {
    const { data, error } = await adminClient
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        patient_id: testPatientId,
        start_time: '2026-06-01T09:00:00.000Z',
        end_time: '2026-06-01T09:30:00.000Z',
        status: 'SCHEDULED',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBeTruthy();

    await cleanupAppointment(adminClient, data!.id);
  });
});

// ─── Sensitive fields ─────────────────────────────────────────────────────────

describe('Appointments — sensitive field exposure', () => {
  let adminClient: SupabaseClient;
  let clinicId: string;
  let createdApptId: string;
  let createdPatientId: string;

  beforeAll(async () => {
    adminClient = await getAuthClient();
    clinicId = await getClinicId(adminClient);

    const { data: patient } = await adminClient
      .from('patients')
      .insert({ first_name: 'SensitiveAppt', last_name: 'Test', clinic_id: clinicId })
      .select()
      .single();
    createdPatientId = patient!.id;

    const { data: appt } = await adminClient
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        patient_id: createdPatientId,
        start_time: '2026-07-01T09:00:00.000Z',
        end_time: '2026-07-01T09:30:00.000Z',
        status: 'SCHEDULED',
      })
      .select()
      .single();
    createdApptId = appt!.id;
  });

  afterAll(async () => {
    await cleanupAppointment(adminClient, createdApptId);
    await cleanupPatient(adminClient, createdPatientId);
    await adminClient.auth.signOut();
  });

  it('appointment records do not contain password or token fields', async () => {
    const { data } = await adminClient
      .from('appointments')
      .select('*')
      .eq('id', createdApptId)
      .single();

    const keys = Object.keys(data ?? {});
    const forbidden = ['password', 'password_hash', 'token', 'secret', 'access_token'];
    for (const field of forbidden) {
      expect(keys).not.toContain(field);
    }
  });

  it('appointment records do not leak auth profile fields', async () => {
    const { data } = await adminClient
      .from('appointments')
      .select('*')
      .eq('id', createdApptId)
      .single();

    const keys = Object.keys(data ?? {});
    expect(keys).not.toContain('is_active');
    expect(keys).not.toContain('role');
    expect(keys).not.toContain('email');
  });
});

// ─── RLS isolation ────────────────────────────────────────────────────────────

describe('Appointments — RLS isolation', () => {
  it('unauthenticated insert is rejected', async () => {
    const anon = getAnonClient();
    const { error } = await anon
      .from('appointments')
      .insert({
        clinic_id: '00000000-0000-0000-0000-000000000000',
        start_time: '2026-05-01T09:00:00.000Z',
        end_time: '2026-05-01T09:30:00.000Z',
        status: 'SCHEDULED',
      })
      .select();

    expect(error).not.toBeNull();
  });
});
