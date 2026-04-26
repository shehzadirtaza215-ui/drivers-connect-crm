// Demo data store — used until Supabase is connected.
// This mirrors exactly the data from the original PHP/MySQL system.

import { Driver, Company, Order, Invoice, Payment, Shift, ComplianceAlert, ActivityItem } from './types';

export const DEMO_DRIVERS: Driver[] = [
  { id: 1, initials: 'JM', first_name: 'James', last_name: 'Mitchell', phone: '07700 900123', email: 'james.mitchell@email.com', address: '14 Station Rd, Cumbernauld G67 1AB', emergency_contact: 'Mary Mitchell', emergency_phone: '07700 900999', employment_type: 'Self-employed', licence_category: 'Class 1', licence_number: 'MITCHJ801094JM9JT', cpc_number: 'CPC-00134821', cpc_expiry: '2026-04-14', tacho_card: 'TC9912341', rtw_type: 'passport', status: 'active', avatar_color: '#e8f1fb', avatar_text_color: '#185fa5', created_at: '2026-01-10', total_shifts: 38, total_hours: 342, total_earned: 5130, pending_pay: 630, current_order: 'DHL · ORD-041', utr_number: '1234567890' },
  { id: 2, initials: 'SA', first_name: 'Sara', last_name: 'Ahmed', phone: '07700 900456', email: 'sara.ahmed@email.com', employment_type: 'PAYE', licence_category: 'Class 2', cpc_expiry: '2027-06-01', rtw_type: 'visa', rtw_expiry: '2027-06-01', status: 'active', avatar_color: '#fef6e4', avatar_text_color: '#8a5a00', created_at: '2026-02-15', total_shifts: 22, total_hours: 188, total_earned: 2632, pending_pay: 504, current_order: 'Amazon · ORD-042' },
  { id: 3, initials: 'LW', first_name: 'Liam', last_name: 'Walsh', phone: '07700 900789', employment_type: 'Self-employed', licence_category: '7.5T', cpc_expiry: '2028-03-01', rtw_type: 'passport', status: 'active', avatar_color: '#eaf5ec', avatar_text_color: '#2d7a3a', created_at: '2026-03-01', total_shifts: 18, total_hours: 156, total_earned: 2184, pending_pay: 392, current_order: 'Tesco · ORD-043' },
  { id: 4, initials: 'AR', first_name: 'Ahmed', last_name: 'Rashid', phone: '07700 900321', employment_type: 'PAYE', licence_category: 'Class 1', cpc_expiry: '2027-01-01', rtw_type: 'visa', rtw_expiry: '2026-05-02', status: 'available', avatar_color: '#fef0f0', avatar_text_color: '#a32d2d', created_at: '2026-01-20', total_shifts: 30, total_hours: 280, total_earned: 4200, pending_pay: 560 },
  { id: 5, initials: 'PB', first_name: 'Pete', last_name: 'Barlow', phone: '07700 900654', employment_type: 'PAYE', licence_category: 'Class 2', cpc_expiry: '2027-09-01', rtw_type: 'passport', status: 'available', avatar_color: '#f0efed', avatar_text_color: '#555', created_at: '2026-02-01', total_shifts: 10, total_hours: 94, total_earned: 1316, pending_pay: 0 },
];

export const DEMO_COMPANIES: Company[] = [
  { id: 1, code: 'DHL', name: 'DHL Logistics', contact_name: 'Mark Evans', contact_email: 'rep@dhl.com', contact_phone: '0141 900 0001', address: 'Unit 5 Eurocentral ML1', licence_required: 'Class 1', rate_per_hour: 20, payment_terms_days: 14, status: 'active', avatar_color: '#fef6e4', avatar_text_color: '#8a5a00', created_at: '2026-01-10', total_orders: 12, total_hours: 312, total_billed: 5600, total_paid: 4200, outstanding: 1400, driver_count: 3 },
  { id: 2, code: 'AMZ', name: 'Amazon FC', contact_name: 'Lisa Brown', contact_email: 'lisa@amazon.co.uk', contact_phone: '0141 900 0002', licence_required: 'Class 2', rate_per_hour: 19, payment_terms_days: 14, status: 'active', avatar_color: '#e8f1fb', avatar_text_color: '#185fa5', created_at: '2026-02-01', total_orders: 8, total_hours: 184, total_billed: 3690, total_paid: 2800, outstanding: 890, driver_count: 2 },
  { id: 3, code: 'TES', name: 'Tesco Distribution', contact_name: 'Sarah Green', contact_email: 'sarah@tesco.com', contact_phone: '0141 900 0003', licence_required: '7.5T', rate_per_hour: 20, payment_terms_days: 14, status: 'active', avatar_color: '#eaf5ec', avatar_text_color: '#2d7a3a', created_at: '2026-03-01', total_orders: 5, total_hours: 120, total_billed: 2280, total_paid: 1600, outstanding: 680, driver_count: 2 },
];

export const DEMO_ORDERS: Order[] = [
  { id: 4, order_ref: 'ORD-044', company_id: 4, company_name: 'Royal Mail', placed_by: 'Tom Price', start_datetime: '2026-04-19T22:00', start_address: 'Glasgow', end_address: 'Edinburgh', licence_required: 'Class 1', company_rate: 22, min_hours: 8, hours_done: 0, drivers_needed: 1, status: 'draft', created_at: '2026-04-17' },
  { id: 3, order_ref: 'ORD-043', company_id: 3, company_name: 'Tesco Distribution', placed_by: 'Sarah Green', start_datetime: '2026-04-18T14:00', start_address: 'Livingston DC', licence_required: '7.5T', company_rate: 20, min_hours: 8, hours_done: 2.5, drivers_needed: 1, status: 'active', driver_names: 'Liam Walsh', created_at: '2026-04-18' },
  { id: 1, order_ref: 'ORD-041', company_id: 1, company_name: 'DHL Logistics', placed_by: 'Mark Evans', start_datetime: '2026-04-17T06:00', start_address: 'Glasgow', end_address: 'Leeds', licence_required: 'Class 1', company_rate: 20, min_hours: 9, hours_done: 9.5, drivers_needed: 1, status: 'completed', driver_names: 'James Mitchell', created_at: '2026-04-16' },
];

export const DEMO_INVOICES: Invoice[] = [
  { id: 1, invoice_ref: 'INV-2026-018', company_id: 1, company_name: 'DHL Logistics', amount: 1240, issued_date: '2026-04-11', due_date: '2026-04-14', status: 'overdue' },
  { id: 2, invoice_ref: 'INV-2026-019', company_id: 2, company_name: 'Amazon FC', amount: 890, issued_date: '2026-04-14', due_date: '2026-04-21', status: 'sent' },
  { id: 3, invoice_ref: 'INV-2026-020', company_id: 3, company_name: 'Tesco Distribution', amount: 680, issued_date: '2026-04-15', due_date: '2026-04-22', status: 'sent' },
  { id: 4, invoice_ref: 'INV-2026-021', company_id: 4, company_name: 'Royal Mail', amount: 400, issued_date: '2026-04-18', due_date: '2026-04-25', status: 'draft' },
  { id: 5, invoice_ref: 'INV-2026-015', company_id: 1, company_name: 'DHL Logistics', amount: 1080, issued_date: '2026-04-04', due_date: '2026-04-10', paid_date: '2026-04-10', status: 'paid' },
  { id: 6, invoice_ref: 'INV-2026-010', company_id: 1, company_name: 'DHL Logistics', amount: 960, issued_date: '2026-03-25', due_date: '2026-04-01', paid_date: '2026-04-03', status: 'paid' },
];

export const DEMO_PAYMENTS: Payment[] = [
  { id: 1, payment_ref: 'PAY-210', direction: 'in', company_id: 1, amount: 1080, pay_date: '2026-04-15', method: 'bank_transfer', status: 'paid', company_name: 'DHL Logistics' },
  { id: 2, payment_ref: 'PAY-203', direction: 'out', driver_id: 1, amount: 540, pay_date: '2026-04-12', week_ending: '2026-04-11', total_hours: 36, method: 'bank_transfer', status: 'paid', driver_name: 'James Mitchell' },
  { id: 3, payment_ref: 'PAY-205', direction: 'in', company_id: 2, amount: 780, pay_date: '2026-04-10', method: 'bank_transfer', status: 'paid', company_name: 'Amazon FC' },
  { id: 4, payment_ref: 'PAY-199', direction: 'out', driver_id: 2, amount: 504, pay_date: '2026-04-05', week_ending: '2026-04-04', total_hours: 36, method: 'bank_transfer', status: 'paid', driver_name: 'Sara Ahmed' },
  { id: 5, payment_ref: 'PAY-200', direction: 'in', company_id: 1, amount: 960, pay_date: '2026-04-03', method: 'bank_transfer', status: 'paid', company_name: 'DHL Logistics' },
  { id: 6, payment_ref: 'PAY-191', direction: 'out', driver_id: 3, amount: 392, pay_date: '2026-03-29', week_ending: '2026-03-28', total_hours: 28, method: 'bank_transfer', status: 'paid', driver_name: 'Liam Walsh' },
];

export const DEMO_SHIFTS: Shift[] = [
  { id: 1, driver_id: 1, driver_name: 'J. Mitchell', company_id: 1, company_name: 'DHL Logistics', order_ref: 'ORD-041', start_datetime: '2026-04-17', hours_done: 9.5, driver_pay: 142.50, billed: 190, margin: 47.50, status: 'completed' },
  { id: 2, driver_id: 2, driver_name: 'S. Ahmed', company_id: 2, company_name: 'Amazon FC', order_ref: 'ORD-042', start_datetime: '2026-04-18', hours_done: 8, driver_pay: 112, billed: 152, margin: 40, status: 'active' },
  { id: 3, driver_id: 3, driver_name: 'L. Walsh', company_id: 3, company_name: 'Tesco Dist.', order_ref: 'ORD-043', start_datetime: '2026-04-19', hours_done: 8, driver_pay: 112, billed: 160, margin: 48, status: 'upcoming' },
];

export const DEMO_COMPLIANCE: ComplianceAlert[] = [
  { id: 1, alert_type: 'CPC card expired', driver_id: 1, driver_name: 'James Mitchell', expiry_date: '2026-04-14' },
  { id: 2, alert_type: 'Right to work expired', driver_id: 6, driver_name: 'Omar Hassan', expiry_date: '2026-04-10' },
  { id: 3, alert_type: 'Visa expiring', driver_id: 4, driver_name: 'Ahmed Rashid', expiry_date: '2026-05-02' },
  { id: 4, alert_type: 'Driving licence expiring', driver_id: 3, driver_name: 'Liam Walsh', expiry_date: '2026-05-09' },
  { id: 5, alert_type: 'Service agreement renewal', company_id: 1, company_name: 'DHL Logistics', expiry_date: '2026-05-18' },
];

export const DEMO_ACTIVITY: ActivityItem[] = [
  { id: 1, entity_type: 'driver', entity_id: 1, action: 'CPC expiry updated', field_changed: 'cpc_expiry', old_value: '14 Apr 2027', new_value: '14 Apr 2026', performed_by_name: 'Ertaza', performed_at: '2026-04-18T09:14' },
  { id: 2, entity_type: 'driver', entity_id: 1, action: 'Assigned to order ORD-041', performed_by_name: 'Ertaza', performed_at: '2026-04-16T17:30' },
  { id: 3, entity_type: 'order', entity_id: 1, action: 'Order ORD-041 completed — 9.5h logged', performed_by_name: 'Ertaza', performed_at: '2026-04-17T15:30' },
  { id: 4, entity_type: 'payment', entity_id: 2, action: 'Payment PAY-203 logged — £540', performed_by_name: 'Ertaza', performed_at: '2026-04-12T10:00' },
];
