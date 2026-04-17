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
      const { data: invoices, error: invErr } = await db
        .from('invoices')
        .select('id')
        .eq('patient_id', patientId!)
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null);
      if (invErr) throw invErr;

      if (!invoices || invoices.length === 0) return [];

      const invoiceIds = (invoices as { id: string }[]).map((i) => i.id);

      const { data: payments, error: payErr } = await db
        .from('payments')
        .select('id, amount, payment_method, payment_date, invoice_id')
        .eq('clinic_id', clinicId!)
        .in('invoice_id', invoiceIds)
        .order('payment_date', { ascending: false });
      if (payErr) throw payErr;

      return payments as PatientPayment[];
    },
  });
}

export function usePatientSummary(patientId: string | null) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery<PatientSummary>({
    queryKey: ['patient-summary', clinicId, patientId],
    enabled: !!patientId && !!clinicId,
    queryFn: async (): Promise<PatientSummary> => {
      console.log('[summary] queryFn start', { patientId, clinicId });

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
          .eq('clinic_id', clinicId!)
          .order('start_time', { ascending: false }),
        db
          .from('invoices')
          .select(
            'id, patient_id, clinic_id, invoice_number, total_amount, balance_due, status, due_date, created_at'
          )
          .eq('patient_id', patientId!)
          .eq('clinic_id', clinicId!)
      ]);
      if (appointmentsRes.error) throw appointmentsRes.error;
      if (invoicesRes.error) throw invoicesRes.error;

      const appointmentsRaw = appointmentsRes.data;
      const invoicesRaw = invoicesRes.data;
      const appointments = (
        Array.isArray(appointmentsRaw)
          ? appointmentsRaw
          : appointmentsRaw != null
            ? [appointmentsRaw]
            : []
      ) as PatientAppointment[];
      const invoices = (
        Array.isArray(invoicesRaw)
          ? invoicesRaw
          : invoicesRaw != null
            ? [invoicesRaw]
            : []
      ) as PatientInvoice[];

      const invoiceIds = invoices.map((i) => i.id);
      console.log('[summary] invoiceIds for payments fetch', invoiceIds);

      let payments: PatientPayment[] = [];
      if (invoiceIds.length > 0) {
        const { data: paymentsData, error: paymentsErr } = await db
          .from('payments')
          .select('id, amount, payment_method, payment_date, invoice_id')
          .eq('clinic_id', clinicId!)
          .in('invoice_id', invoiceIds);

        console.log('[summary] paymentsRes', { data: paymentsData, error: paymentsErr });
        if (paymentsErr) throw paymentsErr;
        payments = (paymentsData ?? []) as PatientPayment[];
      }

      const visitCount = appointments.length;
      const completedVisitsCount = appointments.filter(
        (a) => a.status === 'COMPLETED'
      ).length;
      const totalInvoiced = invoices.reduce(
        (sum, inv) => sum + Number(inv.total_amount ?? 0),
        0
      );
      const totalPaid = payments.reduce(
        (sum, p) => sum + Number(p.amount ?? 0),
        0
      );
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

      const derived: PatientSummary = {
        visitCount,
        completedVisitsCount,
        totalInvoiced,
        totalPaid,
        balanceDue,
        paymentStatus,
        latestAppointment,
      };

      console.log('[summary] derived', derived);
      return derived;
    },
  });
}
