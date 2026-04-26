/**
 * Data Access Layer — Centralized Supabase queries
 * All functions query Supabase directly. No demo data.
 */

import { createClient } from '@/lib/supabase/client';
import type { Driver, Company, Order, Invoice, Payment, Shift, ComplianceAlert, ActivityItem } from '@/lib/types';

function sb() { return createClient(); }

// ═══════ DRIVERS ═══════

export async function fetchDrivers(category?: string): Promise<Driver[]> {
  let query = sb().from('drivers').select('*').order('first_name');
  if (category && category !== 'all') query = query.eq('licence_category', category);
  const { data: drivers, error } = await query;
  if (error) { console.error('fetchDrivers error:', error); return []; }

  // Merge computed stats from driver_stats view (total_shifts, pending_pay, etc.)
  const { data: stats } = await sb().from('driver_stats').select('*');
  const sMap = new Map((stats || []).map((s: any) => [s.id, s]));

  return (drivers || []).map((d: any) => {
    const s = sMap.get(d.id);
    return { ...d, total_shifts: s?.total_shifts || 0, total_hours: s?.total_hours || 0, total_earned: s?.total_earned || 0, pending_pay: s?.pending_pay || 0 };
  });
}

export async function fetchDriver(id: number): Promise<Driver | null> {
  const { data, error } = await sb().from('drivers').select('*').eq('id', id).single();
  if (error) { console.error('fetchDriver error:', error); return null; }
  const { data: stats } = await sb().from('driver_stats').select('*').eq('id', id).single();
  if (stats) { (data as any).total_shifts = (stats as any).total_shifts || 0; (data as any).total_hours = (stats as any).total_hours || 0; (data as any).total_earned = (stats as any).total_earned || 0; (data as any).pending_pay = (stats as any).pending_pay || 0; }
  return data;
}

export async function uploadAvatar(file: File, driverId: number): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const filePath = `avatars/driver_${driverId}_${Date.now()}.${ext}`;
  const { data, error } = await sb().storage.from('documents').upload(filePath, file);
  if (error) { console.error('Avatar upload error:', error); return null; }
  const { data: publicUrlData } = sb().storage.from('documents').getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}

export async function createDriver(driver: Partial<Driver>): Promise<{ data: Driver | null, error: any }> {
  const { data, error } = await sb().from('drivers').insert(driver as never).select().single();
  if (error) { console.error('createDriver error:', error); return { data: null, error }; }
  if (data) await logActivity({ entity_type: 'driver', entity_id: (data as any).id, action: 'Driver added', new_value: `${driver.first_name} ${driver.last_name}` });
  return { data, error: null };
}

export async function updateDriver(id: number, updates: Partial<Driver>): Promise<Driver | null> {
  const { data, error } = await sb().from('drivers').update(updates as never).eq('id', id).select().single();
  if (error) { console.error('updateDriver error:', error); return null; }
  if (data) await logActivity({ entity_type: 'driver', entity_id: id, action: 'Driver updated' });
  return data;
}

export async function deleteDriver(id: number): Promise<boolean> {
  await logActivity({ entity_type: 'driver', entity_id: id, action: 'Driver deleted' });
  const { error } = await sb().from('drivers').delete().eq('id', id);
  if (error) { console.error('deleteDriver error:', error); return false; }
  return true;
}

// ═══════ COMPANIES ═══════

export async function fetchCompanies(): Promise<Company[]> {
  const { data: companies, error } = await sb().from('companies').select('*').order('name');
  if (error) { console.error('fetchCompanies error:', error); return []; }

  // Merge computed stats from company_stats view
  const { data: stats } = await sb().from('company_stats').select('*');
  const sMap = new Map((stats || []).map((s: any) => [s.id, s]));

  return (companies || []).map((c: any) => {
    const s = sMap.get(c.id);
    return { ...c, total_orders: s?.total_orders || 0, total_hours: s?.total_hours || 0, total_billed: s?.total_billed || 0, total_paid: s?.total_paid || 0, driver_count: s?.driver_count || 0, outstanding: (s?.total_billed || 0) - (s?.total_paid || 0) };
  });
}

export async function fetchCompany(id: number): Promise<Company | null> {
  const { data, error } = await sb().from('companies').select('*').eq('id', id).single();
  if (error) { console.error('fetchCompany error:', error); return null; }
  const { data: stats } = await sb().from('company_stats').select('*').eq('id', id).single();
  if (stats) { (data as any).total_orders = (stats as any).total_orders || 0; (data as any).total_hours = (stats as any).total_hours || 0; (data as any).total_billed = (stats as any).total_billed || 0; (data as any).total_paid = (stats as any).total_paid || 0; (data as any).driver_count = (stats as any).driver_count || 0; (data as any).outstanding = ((stats as any).total_billed || 0) - ((stats as any).total_paid || 0); }
  return data;
}

export async function createCompany(company: Partial<Company>): Promise<{ data: Company | null, error: any }> {
  const { data, error } = await sb().from('companies').insert(company as never).select().single();
  if (error) { console.error('createCompany error:', error); return { data: null, error }; }
  if (data) await logActivity({ entity_type: 'company', entity_id: (data as any).id, action: 'Company created', new_value: (data as any).name });
  return { data, error: null };
}

export async function updateCompany(id: number, updates: Partial<Company>): Promise<Company | null> {
  const { data, error } = await sb().from('companies').update(updates as never).eq('id', id).select().single();
  if (error) { console.error('updateCompany error:', error); return null; }
  if (data) await logActivity({ entity_type: 'company', entity_id: id, action: 'Company updated' });
  return data;
}

export async function deleteCompany(id: number): Promise<boolean> {
  await logActivity({ entity_type: 'company', entity_id: id, action: 'Company deleted' });
  const { error } = await sb().from('companies').delete().eq('id', id);
  if (error) { console.error('deleteCompany error:', error); return false; }
  return true;
}

// ═══════ ORDERS ═══════

export async function fetchOrders(status?: string): Promise<Order[]> {
  let query = sb().from('orders').select('*, companies(name), order_drivers(driver_id, driver_rate, drivers(first_name, last_name))').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) { console.error('fetchOrders error:', error); return []; }
  return (data || []).map((o: any) => {
    const assignments = o.order_drivers || [];
    const names = assignments.filter((od: any) => od.drivers).map((od: any) => `${od.drivers.first_name} ${od.drivers.last_name}`).join(', ');
    return { ...o, company_name: o.companies?.name || '', driver_names: names || undefined, companies: undefined, order_drivers: undefined };
  }) as Order[];
}

export async function createOrder(order: Partial<Order>): Promise<{ data: Order | null, error: any }> {
  const { data, error } = await sb().from('orders').insert(order as never).select().single();
  if (error) { console.error('createOrder error:', error); return { data: null, error }; }
  if (data) await logActivity({ entity_type: 'order', entity_id: (data as any).id, action: 'Order created', new_value: (data as any).order_ref });
  return { data, error: null };
}

export async function updateOrder(id: number, updates: Partial<Order>): Promise<Order | null> {
  const { data, error } = await sb().from('orders').update(updates as never).eq('id', id).select().single();
  if (error) { console.error('updateOrder error:', error); return null; }
  if (data) await logActivity({ entity_type: 'order', entity_id: id, action: `Order ${(data as any).status}` });
  return data;
}

export async function deleteOrder(id: number): Promise<boolean> {
  const { error } = await sb().from('orders').delete().eq('id', id);
  if (error) { console.error('deleteOrder error:', error); return false; }
  return true;
}

// ═══════ ORDER DRIVERS (shift assignments) ═══════

export async function createOrderDriver(od: { order_id: number; driver_id: number; driver_rate: number; start_address?: string }) {
  const { data, error } = await sb().from('order_drivers').insert(od as never).select().single();
  if (error) { console.error('createOrderDriver error:', error); return { data: null, error }; }
  return { data, error: null };
}

export async function updateOrderDriverHours(orderId: number, hours: number) {
  const { error } = await sb().from('order_drivers').update({ hours_done: hours } as never).eq('order_id', orderId);
  if (error) console.error('updateOrderDriverHours error:', error);
}

export async function fetchOrderDrivers(filters?: { driver_id?: number; company_id?: number }): Promise<any[]> {
  let query = sb()
    .from('order_drivers')
    .select('*, drivers(id, first_name, last_name, licence_category, avatar_color, avatar_text_color, initials, status), orders(id, order_ref, company_id, company_rate, start_datetime, start_address, end_address, hours_done, status, companies(id, name))')
    .order('created_at', { ascending: false });
  if (filters?.driver_id) query = query.eq('driver_id', filters.driver_id);
  const { data, error } = await query;
  if (error) { console.error('fetchOrderDrivers error:', error); return []; }
  let results = data || [];
  if (filters?.company_id) results = results.filter((od: any) => od.orders?.company_id === filters.company_id);
  return results;
}

export async function markDriverShiftsPaid(driverId: number) {
  const { error } = await sb().from('order_drivers').update({ status: 'paid' } as never).eq('driver_id', driverId).neq('status', 'paid');
  if (error) console.error('markDriverShiftsPaid error:', error);
}

// ═══════ INVOICES ═══════

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data, error } = await sb().from('invoices').select('*, companies(name)').order('issued_date', { ascending: false });
  if (error) { console.error('fetchInvoices error:', error); return []; }
  return (data || []).map((i: any) => ({ ...i, company_name: i.companies?.name || '' })) as Invoice[];
}

export async function createInvoice(invoice: Partial<Invoice>): Promise<Invoice | null> {
  const { data, error } = await sb().from('invoices').insert(invoice as never).select().single();
  if (error) { console.error('createInvoice error:', error); return null; }
  if (data) await logActivity({ entity_type: 'invoice', entity_id: (data as any).id, action: 'Invoice created' });
  return data;
}

export async function updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | null> {
  const { data, error } = await sb().from('invoices').update(updates as never).eq('id', id).select().single();
  if (error) { console.error('updateInvoice error:', error); return null; }
  return data;
}

export async function deleteInvoice(id: number): Promise<boolean> {
  const { error } = await sb().from('invoices').delete().eq('id', id);
  if (error) { console.error('deleteInvoice error:', error); return false; }
  return true;
}

// ═══════ PAYMENTS ═══════

export async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await sb().from('payments').select('*, drivers(first_name, last_name), companies(name)').order('pay_date', { ascending: false });
  if (error) { console.error('fetchPayments error:', error); return []; }
  return (data || []).map((p: any) => ({
    ...p,
    driver_name: p.drivers ? `${p.drivers.first_name} ${p.drivers.last_name}` : undefined,
    company_name: p.companies?.name || undefined,
  })) as Payment[];
}

export async function createPayment(payment: Partial<Payment>): Promise<Payment | null> {
  const { data, error } = await sb().from('payments').insert(payment as never).select().single();
  if (error) { console.error('createPayment error:', error); return null; }
  if (data) await logActivity({ entity_type: 'payment', entity_id: (data as any).id, action: `Payment ${(payment as any).direction === 'in' ? 'received' : 'sent'}` });
  return data;
}

export async function deletePayment(id: number): Promise<boolean> {
  const { error } = await sb().from('payments').delete().eq('id', id);
  if (error) { console.error('deletePayment error:', error); return false; }
  return true;
}

// ═══════ SHIFTS (from order_drivers join) ═══════

export async function fetchShifts(): Promise<Shift[]> {
  const { data, error } = await sb()
    .from('order_drivers')
    .select('*, drivers(first_name, last_name), orders(order_ref, company_id, company_rate, start_datetime, companies(name))')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchShifts error:', error); return []; }
  return (data || []).map((s: any) => {
    const dRate = s.driver_rate || 14;
    const hrs = s.hours_done || 0;
    const coRate = s.orders?.company_rate || 0;
    return { id: s.id, driver_id: s.driver_id, driver_name: s.drivers ? `${s.drivers.first_name} ${s.drivers.last_name}` : '', company_id: s.orders?.company_id || 0, company_name: s.orders?.companies?.name || '', order_ref: s.orders?.order_ref || '', start_datetime: s.orders?.start_datetime || '', hours_done: hrs, driver_pay: hrs * dRate, billed: hrs * coRate, margin: hrs * (coRate - dRate), status: s.status || 'assigned' };
  }) as Shift[];
}

// ═══════ COMPLIANCE ═══════

export async function fetchCompliance(): Promise<ComplianceAlert[]> {
  const alerts: ComplianceAlert[] = [];
  const { data: drivers } = await sb().from('drivers').select('id, first_name, last_name, cpc_expiry, rtw_type, rtw_expiry');
  (drivers || []).forEach((d: any) => {
    if (d.cpc_expiry) alerts.push({ id: alerts.length + 1, alert_type: new Date(d.cpc_expiry) < new Date() ? 'CPC card expired' : 'CPC expiring', driver_id: d.id, driver_name: `${d.first_name} ${d.last_name}`, expiry_date: d.cpc_expiry });
    if (d.rtw_type !== 'passport' && d.rtw_expiry) alerts.push({ id: alerts.length + 1, alert_type: 'Visa expiring', driver_id: d.id, driver_name: `${d.first_name} ${d.last_name}`, expiry_date: d.rtw_expiry });
  });
  return alerts.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
}

// ═══════ ACTIVITY LOG ═══════

export async function fetchActivity(entityType?: string, entityId?: number): Promise<ActivityItem[]> {
  let query = sb().from('activity_log').select('*').order('performed_at', { ascending: false }).limit(50);
  if (entityType) query = query.eq('entity_type', entityType);
  if (entityId) query = query.eq('entity_id', entityId);
  const { data, error } = await query;
  if (error) { console.error('fetchActivity error:', error); return []; }
  return data || [];
}

export async function logActivity(item: Partial<ActivityItem>): Promise<void> {
  const { error } = await sb().from('activity_log').insert({ ...item, performed_by_name: 'Admin' } as never);
  if (error) console.error('logActivity error:', error);
}

// ═══════ DOCUMENTS / STORAGE ═══════

export async function uploadDocument(entityType: string, entityId: number, docType: string, file: File): Promise<string | null> {
  const path = `${entityType}/${entityId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await sb().storage.from('documents').upload(path, file);
  if (uploadError) { console.error('Upload error:', uploadError); return null; }
  const { error: dbError } = await sb().from('documents').insert({ entity_type: entityType, entity_id: entityId, doc_type: docType, file_name: file.name, storage_path: path, mime_type: file.type, file_size: file.size } as never);
  if (dbError) console.error('Doc record error:', dbError);
  return path;
}

export async function fetchDocuments(entityType: string, entityId: number) {
  const { data, error } = await sb().from('documents').select('*').eq('entity_type', entityType).eq('entity_id', entityId).order('uploaded_at', { ascending: false });
  if (error) { console.error('fetchDocuments error:', error); return []; }
  return data || [];
}

export function getDocumentUrl(storagePath: string): string {
  const { data } = sb().storage.from('documents').getPublicUrl(storagePath);
  return data?.publicUrl || '#';
}
