export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string; name: string; phone: string | null;
          address: string | null; is_active: boolean;
          deleted_at: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; name: string; phone?: string | null;
          address?: string | null; is_active?: boolean;
          deleted_at?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; name?: string; phone?: string | null;
          address?: string | null; is_active?: boolean;
          deleted_at?: string | null; created_at?: string; updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string; clinic_id: string;
          role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'ACCOUNTANT';
          full_name: string; phone: string | null; is_active: boolean;
          specialization: string | null;
          deleted_at: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; clinic_id: string;
          role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'ACCOUNTANT';
          full_name: string; phone?: string | null; is_active?: boolean;
          specialization?: string | null;
          deleted_at?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; clinic_id?: string;
          role?: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'ACCOUNTANT';
          full_name?: string; phone?: string | null; is_active?: boolean;
          specialization?: string | null;
          deleted_at?: string | null; created_at?: string; updated_at?: string;
        };
      };
      patients: {
        Row: {
          id: string; clinic_id: string;
          first_name: string; last_name: string; phone: string | null;
          dob: string | null; gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
          medical_alerts: string | null; notes: string | null;
          deleted_at: string | null; created_by: string | null;
          updated_by: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; clinic_id: string;
          first_name: string; last_name: string; phone?: string | null;
          dob?: string | null; gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
          medical_alerts?: string | null; notes?: string | null;
          deleted_at?: string | null; created_by?: string | null;
          updated_by?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; clinic_id?: string;
          first_name?: string; last_name?: string; phone?: string | null;
          dob?: string | null; gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
          medical_alerts?: string | null; notes?: string | null;
          deleted_at?: string | null; created_by?: string | null;
          updated_by?: string | null; created_at?: string; updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string; clinic_id: string; name: string;
          category: string | null; default_price: number;
          duration_minutes: number | null; is_active: boolean;
          deleted_at: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; clinic_id: string; name: string;
          category?: string | null; default_price?: number;
          duration_minutes?: number | null; is_active?: boolean;
          deleted_at?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; clinic_id?: string; name?: string;
          category?: string | null; default_price?: number;
          duration_minutes?: number | null; is_active?: boolean;
          deleted_at?: string | null; created_at?: string; updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string; clinic_id: string;
          patient_id: string | null; walk_in_name: string | null;
          walk_in_phone: string | null; doctor_id: string | null;
          service_id: string | null; start_time: string; end_time: string | null;
          status: 'SCHEDULED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | null;
          notes: string | null; deleted_at: string | null;
          created_by: string | null; updated_by: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; clinic_id?: string;
          patient_id?: string | null; walk_in_name?: string | null;
          walk_in_phone?: string | null; doctor_id?: string | null;
          service_id?: string | null; start_time: string; end_time?: string | null;
          status?: 'SCHEDULED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | null;
          notes?: string | null; deleted_at?: string | null;
          created_by?: string | null; updated_by?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; clinic_id?: string;
          patient_id?: string | null; walk_in_name?: string | null;
          walk_in_phone?: string | null; doctor_id?: string | null;
          service_id?: string | null; start_time?: string; end_time?: string | null;
          status?: 'SCHEDULED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | null;
          notes?: string | null; deleted_at?: string | null;
          created_by?: string | null; updated_by?: string | null;
          created_at?: string; updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string; clinic_id: string; name: string;
          phone: string | null; service_interest: string | null;
          source: string | null;
          status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'LOST';
          notes: string | null; converted_patient_id: string | null;
          follow_up_date: string | null; deleted_at: string | null;
          created_by: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; clinic_id?: string; name: string;
          phone?: string | null; service_interest?: string | null;
          source?: string | null;
          status?: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'LOST';
          notes?: string | null; converted_patient_id?: string | null;
          follow_up_date?: string | null; deleted_at?: string | null;
          created_by?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; clinic_id?: string; name?: string;
          phone?: string | null; service_interest?: string | null;
          source?: string | null;
          status?: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'LOST';
          notes?: string | null; converted_patient_id?: string | null;
          follow_up_date?: string | null; deleted_at?: string | null;
          created_by?: string | null; created_at?: string; updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string; clinic_id: string; invoice_number: string;
          patient_id: string | null; doctor_id: string | null;
          treatment_plan_id: string | null;
          subtotal: number | null; discount: number | null;
          total_amount: number; balance_due: number;
          status: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | null;
          notes: string | null; due_date: string | null;
          deleted_at: string | null; created_by: string | null;
          updated_by: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; clinic_id?: string; invoice_number?: string;
          patient_id?: string | null; doctor_id?: string | null;
          treatment_plan_id?: string | null;
          subtotal?: number | null; discount?: number | null;
          total_amount: number; balance_due: number;
          status?: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | null;
          notes?: string | null; due_date?: string | null;
          deleted_at?: string | null; created_by?: string | null;
          updated_by?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; clinic_id?: string; invoice_number?: string;
          patient_id?: string | null; doctor_id?: string | null;
          treatment_plan_id?: string | null;
          subtotal?: number | null; discount?: number | null;
          total_amount?: number; balance_due?: number;
          status?: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | null;
          notes?: string | null; due_date?: string | null;
          deleted_at?: string | null; created_by?: string | null;
          updated_by?: string | null; created_at?: string; updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string; clinic_id: string; invoice_id: string;
          amount: number;
          payment_method: string;
          payment_date: string; notes: string | null;
          deleted_at: string | null;
          collected_by: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; clinic_id?: string; invoice_id: string;
          amount: number;
          payment_method: string;
          payment_date: string; notes?: string | null;
          deleted_at?: string | null;
          collected_by?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; clinic_id?: string; invoice_id?: string;
          amount?: number;
          payment_method?: string;
          payment_date?: string; notes?: string | null;
          deleted_at?: string | null;
          collected_by?: string | null; created_at?: string; updated_at?: string;
        };
      };
      treatment_plans: {
        Row: {
          id: string; clinic_id: string; patient_id: string | null;
          doctor_id: string | null; title: string | null; name: string | null;
          description: string | null;
          total_estimated_cost: number | null;
          status: 'ACTIVE' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED' | null;
          start_date: string | null; end_date: string | null;
          deleted_at: string | null; created_by: string | null;
          updated_by: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; clinic_id?: string; patient_id?: string | null;
          doctor_id?: string | null; title?: string | null; name?: string | null;
          description?: string | null;
          total_estimated_cost?: number | null;
          status?: 'ACTIVE' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED' | null;
          start_date?: string | null; end_date?: string | null;
          deleted_at?: string | null; created_by?: string | null;
          updated_by?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; clinic_id?: string; patient_id?: string | null;
          doctor_id?: string | null; title?: string | null; name?: string | null;
          description?: string | null;
          total_estimated_cost?: number | null;
          status?: 'ACTIVE' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED' | null;
          start_date?: string | null; end_date?: string | null;
          deleted_at?: string | null; created_by?: string | null;
          updated_by?: string | null; created_at?: string; updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: { get_auth_clinic_id: { Args: Record<string, never>; Returns: string; }; };
    Enums: {
      user_role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'ACCOUNTANT';
      gender_enum: 'MALE' | 'FEMALE' | 'OTHER';
      appointment_status: 'SCHEDULED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
      treatment_status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      invoice_status: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
      payment_method: 'CASH' | 'CARD' | 'INSTAPAY' | 'VODAFONE_CASH';
    };
  };
};
