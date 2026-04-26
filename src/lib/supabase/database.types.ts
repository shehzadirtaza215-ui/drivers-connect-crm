/**
 * Supabase Database type definitions
 *
 * These map directly to the PostgreSQL schema tables.
 * Used by the Supabase client for type-safe queries.
 *
 * To auto-generate from your live schema, run:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      drivers: {
        Row: {
          id: number;
          initials: string | null;
          first_name: string;
          last_name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          emergency_contact: string | null;
          emergency_phone: string | null;
          employment_type: string;
          licence_category: string | null;
          licence_number: string | null;
          cpc_number: string | null;
          cpc_expiry: string | null;
          tacho_card: string | null;
          rtw_type: string | null;
          rtw_expiry: string | null;
          share_code: string | null;
          utr_number: string | null;
          ni_number: string | null;
          tax_code: string | null;
          status: string;
          notes: string | null;
          avatar_color: string;
          avatar_text_color: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['drivers']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['drivers']['Insert']>;
      };
      companies: {
        Row: {
          id: number;
          code: string;
          name: string;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          licence_required: string | null;
          rate_per_hour: number;
          payment_terms_days: number;
          status: string;
          notes: string | null;
          avatar_color: string;
          avatar_text_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };
      orders: {
        Row: {
          id: number;
          order_ref: string | null;
          company_id: number | null;
          placed_by: string | null;
          start_datetime: string | null;
          start_address: string | null;
          end_address: string | null;
          licence_required: string | null;
          company_rate: number;
          min_hours: number;
          hours_done: number;
          drivers_needed: number;
          status: string;
          cancellation_reason: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_ref' | 'created_at' | 'updated_at'> & {
          id?: number;
          order_ref?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_drivers: {
        Row: {
          id: number;
          order_id: number | null;
          driver_id: number | null;
          driver_rate: number;
          hours_done: number;
          start_address: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_drivers']['Row'], 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_drivers']['Insert']>;
      };
      invoices: {
        Row: {
          id: number;
          invoice_ref: string | null;
          company_id: number | null;
          amount: number;
          issued_date: string;
          due_date: string | null;
          paid_date: string | null;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'invoice_ref' | 'created_at'> & {
          id?: number;
          invoice_ref?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      payments: {
        Row: {
          id: number;
          payment_ref: string | null;
          direction: 'in' | 'out';
          driver_id: number | null;
          company_id: number | null;
          invoice_id: number | null;
          amount: number;
          pay_date: string;
          week_ending: string | null;
          total_hours: number;
          method: string | null;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'payment_ref' | 'created_at'> & {
          id?: number;
          payment_ref?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      documents: {
        Row: {
          id: number;
          entity_type: string;
          entity_id: number;
          doc_type: string | null;
          file_name: string | null;
          storage_path: string;
          mime_type: string | null;
          file_size: number | null;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'uploaded_at'> & {
          id?: number;
          uploaded_at?: string;
        };
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      activity_log: {
        Row: {
          id: number;
          entity_type: string | null;
          entity_id: number | null;
          action: string | null;
          field_changed: string | null;
          old_value: string | null;
          new_value: string | null;
          performed_by: string | null;
          performed_by_name: string | null;
          performed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_log']['Row'], 'id' | 'performed_at'> & {
          id?: number;
          performed_at?: string;
        };
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>;
      };
    };
    Views: {
      driver_stats: {
        Row: {
          id: number;
          first_name: string;
          last_name: string;
          total_shifts: number;
          total_hours: number;
          total_earned: number;
          pending_pay: number;
        };
      };
      company_stats: {
        Row: {
          id: number;
          name: string;
          total_orders: number;
          total_hours: number;
          total_billed: number;
          total_paid: number;
          driver_count: number;
        };
      };
    };
  };
}
