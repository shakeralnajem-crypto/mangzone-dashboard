import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface PatientAppointment {
  id: string;
  start_time: string;
  status: string | null;
  notes: string | null;
  doctor: { full_name: string } | null;
  service: { name: string } | null;
}

export interface PatientInvoice {
  id: string;
  invoice_number: string | null;
  total_amount: number;
  balance_due: number;
  status: string | null;
  due_date: string | null;
  created_at: string;
}

export interface PatientPayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  invoice_id: string;
}

export interface PatientSummary {
  visitCount: number;
  completedVisitsCount: number;
  totalInvoiced: number;
  totalPaid: number;
  balanceDue: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  latestAppointment: PatientAppointment | null;
}

export function usePatientAppointments(patientId: string | null) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['patient-appointments', clinicId, patientId],
    enabled: !!patientId && !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('appointments')
        .select(
          `
          id, patient_id, clinic_id, start_time, status, notes,
          doctor:profiles!appointments_doctor_id_fkey(full_name),
          service:services(name)
        `
        )
        .eq('patient_id', patientId!)
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('start_time', { ascending: false });
      if (error) throw error;
      console.debug('[usePatientAppointments] rows', {
        patientId,
        clinicId,
        count: (data ?? []).length,
        rows: (data ?? []).slice(0, 10).map((r: any) => ({
          id: r.id,
          patient_id: r.patient_id,
          clinic_id: r.clinic_id,
          status: r.status,
        })),
      });
      return data as PatientAppointment[];
    },
  });
}

export function usePatientInvoices(patientId: string | null) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['patient-invoices', clinicId, patientId],
    enabled: !!patientId && !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('invoices')
        .select(
          'id, patient_id, clinic_id, invoice_number, total_amount, balance_due, status, due_date, created_at'
        )
        .eq('patient_id', patientId!)
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      console.debug('[usePatientInvoices] rows', {
        patientId,
        clinicId,
        count: (data ?? []).length,
        rows: (data ?? []).slice(0, 10).map((r: any) => ({
          id: r.id,
          patient_id: r.patient_id,
          clinic_id: r.clinic_id,
          total_amount: r.total_amount,
          status: r.status,
          balance_due: r.balance_due,
        })),
      });
      return data as PatientInvoice[];
    },
  });
}

export function usePatientPayments(patientId: string | null) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['patient-payments', clinicId, patientId],
    enabled: !!patientId && !!clinicId,
    queryFn: async () => {
      // Step 1: get invoice IDs for this patient
      const { data: invoices, error: invErr } = await db
        .from('invoices')
        .select('id')
        .eq('patient_id', patientId!)
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null);
      if (invErr) throw invErr;

      if (!invoices || invoices.length === 0) return [];

      const invoiceIds = (invoices as { id: string }[]).map((i) => i.id);

      // Step 2: fetch payments for those invoices (and current clinic only)
      const { data: payments, error: payErr } = await db
        .from('payments')
        .select('id, amount, payment_method, payment_date, notes, invoice_id')
        .eq('clinic_id', clinicId!)
        .in('invoice_id', invoiceIds)
        .is('deleted_at', null)
        .order('payment_date', { ascending: false });
      if (payErr) throw payErr;

      return payments as PatientPayment[];
    },
  });
}

export function usePatientSummary(patientId: string | null) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['patient-summary', clinicId, patientId],
    enabled: !!patientId && !!clinicId,
    queryFn: async (): Promise<PatientSummary> => {
      const [appointmentsRes, invoicesRes] = await Promise.all([
        db
          .from('appointments')
          .select(
            `
            id, patient_id, clinic_id, start_time, status, notes,
            doctor:profiles!appointments_doctor_id_fkey(full_name),
            service:services(name)
          `
          )
          .eq('patient_id', patientId!)
          .is('deleted_at', null)
          .order('start_time', { ascending: false }),
        db
          .from('invoices')
          .select(
            'id, patient_id, clinic_id, invoice_number, total_amount, balance_due, status, due_date, created_at'
          )
          .eq('patient_id', patientId!)
          .is('deleted_at', null),
      ]);

      if (appointmentsRes.error) throw appointmentsRes.error;
      if (invoicesRes.error) throw invoicesRes.error;

      const appointments = (appointmentsRes.data ?? []) as PatientAppointment[];
      const invoices = (invoicesRes.data ?? []) as PatientInvoice[];

      console.debug('[usePatientSummary] context', {
        clinicId,
        patientId,
        appointmentsCount: appointments.length,
        appointmentsSample: appointments.slice(0, 3).map((a) => ({
          id: a.id,
          status: a.status,
          start_time: a.start_time,
        })),
        invoicesCount: invoices.length,
        invoicesSample: invoices.slice(0, 3).map((i) => ({
          id: i.id,
          total_amount: i.total_amount,
          balance_due: i.balance_due,
          status: i.status,
        })),
      });

      const invoiceIds = invoices.map((i) => i.id);

      let payments: PatientPayment[] = [];
      if (invoiceIds.length > 0) {
        const { data: paymentsData, error: paymentsErr } = await db
          .from('payments')
          .select('id, amount, payment_method, payment_date, notes, invoice_id')
          .eq('clinic_id', clinicId!)
          .in('invoice_id', invoiceIds)
          .is('deleted_at', null);

        if (paymentsErr) throw paymentsErr;
        payments = (paymentsData ?? []) as PatientPayment[];
      }

      console.debug('[usePatientSummary] payments', {
        clinicId,
        patientId,
        invoiceIds,
        paymentsCount: payments.length,
        paymentsSample: payments.slice(0, 5).map((p) => ({
          id: p.id,
          invoice_id: p.invoice_id,
          amount: p.amount,
        })),
      });

      const visitCount = appointments.length;
      const completedVisitsCount = appointments.filter(
        (a) => a.status === 'COMPLETED'
      ).length;
      const totalInvoiced = invoices.reduce(
        (sum, inv) => sum + inv.total_amount,
        0
      );
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = Math.max(totalInvoiced - totalPaid, 0);

      const paymentStatus: PatientSummary['paymentStatus'] =
        totalInvoiced <= 0
          ? 'UNPAID'
          : balanceDue <= 0
            ? 'PAID'
            : totalPaid > 0
              ? 'PARTIALLY_PAID'
              : 'UNPAID';

      const latestAppointment =
        appointments.length > 0 ? appointments[0] : null;

      const derived = {
        visitCount,
        completedVisitsCount,
        totalInvoiced,
        totalPaid,
        balanceDue,
        paymentStatus,
        latestAppointment,
      };

      console.debug('[usePatientSummary] derived', {
        clinicId,
        patientId,
        derived,
      });

      return derived;
    },
  });
}
