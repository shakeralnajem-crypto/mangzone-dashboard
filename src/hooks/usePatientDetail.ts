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

export function usePatientAppointments(patientId: string | null) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);

  return useQuery({
    queryKey: ['patient-appointments', patientId],
    enabled: !!patientId && !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('appointments')
        .select(`
          id, start_time, status, notes,
          doctor:profiles!appointments_doctor_id_fkey(full_name),
          service:services(name)
        `)
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
    queryKey: ['patient-invoices', patientId],
    enabled: !!patientId && !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('invoices')
        .select('id, invoice_number, total_amount, balance_due, status, due_date, created_at')
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
    queryKey: ['patient-payments', patientId],
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

      const invoiceIds = (invoices as { id: string }[]).map(i => i.id);

      // Step 2: fetch payments for those invoices
      const { data: payments, error: payErr } = await db
        .from('payments')
        .select('id, amount, payment_method, payment_date, notes, invoice_id')
        .in('invoice_id', invoiceIds)
        .is('deleted_at', null)
        .order('payment_date', { ascending: false });
      if (payErr) throw payErr;

      return payments as PatientPayment[];
    },
  });
}
