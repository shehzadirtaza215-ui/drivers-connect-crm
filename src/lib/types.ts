export interface Driver {
  id: number;
  initials: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  employment_type: string;
  licence_category?: string;
  licence_number?: string;
  cpc_number?: string;
  cpc_expiry?: string;
  tacho_card?: string;
  rtw_type?: string;
  rtw_expiry?: string;
  share_code?: string;
  utr_number?: string;
  ni_number?: string;
  tax_code?: string;
  status: string;
  notes?: string;
  avatar_color: string;
  avatar_text_color: string;
  avatar_url?: string;
  created_at: string;
  // Computed
  total_shifts?: number;
  total_hours?: number;
  total_earned?: number;
  pending_pay?: number;
  current_order?: string;
}

export interface Company {
  id: number;
  code: string;
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  licence_required?: string;
  rate_per_hour: number;
  payment_terms_days: number;
  status: string;
  notes?: string;
  avatar_color: string;
  avatar_text_color: string;
  avatar_url?: string;
  created_at: string;
  // Computed
  total_orders?: number;
  total_hours?: number;
  total_billed?: number;
  total_paid?: number;
  outstanding?: number;
  driver_count?: number;
}

export interface Order {
  id: number;
  order_ref: string;
  company_id: number;
  company_name?: string;
  placed_by?: string;
  start_datetime?: string;
  start_address?: string;
  end_address?: string;
  licence_required?: string;
  company_rate: number;
  min_hours: number;
  hours_done: number;
  drivers_needed: number;
  status: string;
  cancellation_reason?: string;
  notes?: string;
  driver_names?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_ref: string;
  company_id: number;
  company_name?: string;
  amount: number;
  issued_date: string;
  due_date?: string;
  paid_date?: string;
  status: string;
  notes?: string;
}

export interface Payment {
  id: number;
  payment_ref: string;
  direction: 'in' | 'out';
  driver_id?: number;
  company_id?: number;
  invoice_id?: number;
  amount: number;
  pay_date: string;
  week_ending?: string;
  total_hours?: number;
  method?: string;
  status: string;
  notes?: string;
  driver_name?: string;
  company_name?: string;
}

export interface Shift {
  id: number;
  driver_id: number;
  driver_name: string;
  company_id: number;
  company_name: string;
  order_ref: string;
  start_datetime: string;
  hours_done: number;
  driver_pay: number;
  billed: number;
  margin: number;
  status: string;
}

export interface ActivityItem {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  performed_by_name?: string;
  performed_at: string;
}

export interface ComplianceAlert {
  id: number;
  alert_type: string;
  driver_id?: number;
  driver_name?: string;
  company_id?: number;
  company_name?: string;
  expiry_date: string;
}
