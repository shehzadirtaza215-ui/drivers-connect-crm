/**
 * Data Access Layer — Centralized Supabase queries
 *
 * USAGE: Every page imports from here instead of demo-data directly.
 * When USE_DEMO is true (no Supabase connected), it returns demo data.
 * When Supabase is connected, it fetches from the real database.
 *
 * To switch to live: set your .env.local credentials and change USE_DEMO to false.
 */

import { createClient } from '@/lib/supabase/client';
import { DEMO_DRIVERS, DEMO_COMPANIES, DEMO_ORDERS, DEMO_INVOICES, DEMO_PAYMENTS, DEMO_SHIFTS, DEMO_COMPLIANCE, DEMO_ACTIVITY } from '@/lib/demo-data';
import type { Driver, Company, Order, Invoice, Payment, Shift, ComplianceAlert, ActivityItem } from '@/lib/types';

// ═══════ DEMO MODE TOGGLE ═══════
// Set to false once your Supabase .env.local credentials are real
const USE_DEMO = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co'
  || !process.env.NEXT_PUBLIC_SUPABASE_URL;

function supabase() {
  return createClient();
}

// ═══════ DRIVERS ═══════

export async function fetchDrivers(category?: string): Promise<Driver[]> {
  if (USE_DEMO) {
    const all = DEMO_DRIVERS;
    return category && category !== 'all' ? all.filter(d => d.licence_category === category) : all;
  }
  let query = supabase().from('drivers').select('*').order('first_name');
  if (category && category !== 'all') query = query.eq('licence_category', category);
  const { data, error } = await query;
  if (error) { console.error('fetchDrivers error:', error); return []; }
  return data || [];
}

export async function fetchDriver(id: number): Promise<Driver | null> {
  if (USE_DEMO) return DEMO_DRIVERS.find(d => d.id === id) || null;
  const { data, error } = await supabase().from('drivers').select('*').eq('id', id).single();
  if (error) { console.error('fetchDriver error:', error); return null; }
  return data;
}

export async function createDriver(driver: Partial<Driver>): Promise<Driver | null> {
  if (USE_DEMO) return { ...driver, id: Date.now() } as Driver;
  const { data, error } = await supabase().from('drivers').insert(driver as never).select().single();
  if (error) { console.error('createDriver error:', error); return null; }
  return data;
}

export async function updateDriver(id: number, updates: Partial<Driver>): Promise<Driver | null> {
  if (USE_DEMO) return { ...DEMO_DRIVERS.find(d => d.id === id)!, ...updates } as Driver;
  const { data, error } = await supabase().from('drivers').update(updates as never).eq('id', id).select().single();
  if (error) { console.error('updateDriver error:', error); return null; }
  return data;
}

// ═══════ COMPANIES ═══════

export async function fetchCompanies(): Promise<Company[]> {
  if (USE_DEMO) return DEMO_COMPANIES;
  const { data, error } = await supabase().from('companies').select('*').order('name');
  if (error) { console.error('fetchCompanies error:', error); return []; }
  return data || [];
}

export async function fetchCompany(id: number): Promise<Company | null> {
  if (USE_DEMO) return DEMO_COMPANIES.find(c => c.id === id) || null;
  const { data, error } = await supabase().from('companies').select('*').eq('id', id).single();
  if (error) { console.error('fetchCompany error:', error); return null; }
  return data;
}

export async function createCompany(company: Partial<Company>): Promise<Company | null> {
  if (USE_DEMO) return { ...company, id: Date.now() } as Company;
  const { data, error } = await supabase().from('companies').insert(company as never).select().single();
  if (error) { console.error('createCompany error:', error); return null; }
  return data;
}

export async function updateCompany(id: number, updates: Partial<Company>): Promise<Company | null> {
  if (USE_DEMO) return { ...DEMO_COMPANIES.find(c => c.id === id)!, ...updates } as Company;
  const { data, error } = await supabase().from('companies').update(updates as never).eq('id', id).select().single();
  if (error) { console.error('updateCompany error:', error); return null; }
  return data;
}

// ═══════ ORDERS ═══════

export async function fetchOrders(status?: string): Promise<Order[]> {
  if (USE_DEMO) {
    return status && status !== 'all' ? DEMO_ORDERS.filter(o => o.status === status) : DEMO_ORDERS;
  }
  let query = supabase().from('orders').select('*, companies(name)').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) { console.error('fetchOrders error:', error); return []; }
  return (data || []).map((o: Record<string, unknown>) => ({
    ...o,
    company_name: (o.companies as Record<string, unknown>)?.name as string || '',
  })) as Order[];
}

export async function createOrder(order: Partial<Order>): Promise<Order | null> {
  if (USE_DEMO) return { ...order, id: Date.now(), order_ref: `ORD-${Date.now() % 1000}` } as Order;
  const { data, error } = await supabase().from('orders').insert(order as never).select().single();
  if (error) { console.error('createOrder error:', error); return null; }
  return data;
}

export async function updateOrder(id: number, updates: Partial<Order>): Promise<Order | null> {
  if (USE_DEMO) return { ...DEMO_ORDERS.find(o => o.id === id)!, ...updates } as Order;
  const { data, error } = await supabase().from('orders').update(updates as never).eq('id', id).select().single();
  if (error) { console.error('updateOrder error:', error); return null; }
  return data;
}

// ═══════ INVOICES ═══════

export async function fetchInvoices(): Promise<Invoice[]> {
  if (USE_DEMO) return DEMO_INVOICES;
  const { data, error } = await supabase().from('invoices').select('*, companies(name)').order('issued_date', { ascending: false });
  if (error) { console.error('fetchInvoices error:', error); return []; }
  return (data || []).map((i: Record<string, unknown>) => ({
    ...i,
    company_name: (i.companies as Record<string, unknown>)?.name as string || '',
  })) as Invoice[];
}

export async function createInvoice(invoice: Partial<Invoice>): Promise<Invoice | null> {
  if (USE_DEMO) return { ...invoice, id: Date.now() } as Invoice;
  const { data, error } = await supabase().from('invoices').insert(invoice as never).select().single();
  if (error) { console.error('createInvoice error:', error); return null; }
  return data;
}

export async function updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | null> {
  if (USE_DEMO) return { ...DEMO_INVOICES.find(i => i.id === id)!, ...updates } as Invoice;
  const { data, error } = await supabase().from('invoices').update(updates as never).eq('id', id).select().single();
  if (error) { console.error('updateInvoice error:', error); return null; }
  return data;
}

// ═══════ PAYMENTS ═══════

export async function fetchPayments(): Promise<Payment[]> {
  if (USE_DEMO) return DEMO_PAYMENTS;
  const { data, error } = await supabase().from('payments').select('*, drivers(first_name, last_name), companies(name)').order('pay_date', { ascending: false });
  if (error) { console.error('fetchPayments error:', error); return []; }
  return (data || []).map((p: Record<string, unknown>) => ({
    ...p,
    driver_name: (p.drivers as Record<string, unknown>)
      ? `${(p.drivers as Record<string, unknown>).first_name} ${(p.drivers as Record<string, unknown>).last_name}`
      : undefined,
    company_name: (p.companies as Record<string, unknown>)?.name as string || undefined,
  })) as Payment[];
}

export async function createPayment(payment: Partial<Payment>): Promise<Payment | null> {
  if (USE_DEMO) return { ...payment, id: Date.now() } as Payment;
  const { data, error } = await supabase().from('payments').insert(payment as never).select().single();
  if (error) { console.error('createPayment error:', error); return null; }
  return data;
}

// ═══════ SHIFTS (from order_drivers join) ═══════

export async function fetchShifts(): Promise<Shift[]> {
  if (USE_DEMO) return DEMO_SHIFTS;
  const { data, error } = await supabase()
    .from('order_drivers')
    .select('*, drivers(first_name, last_name), orders(order_ref, company_id, company_rate, start_datetime, companies(name))')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchShifts error:', error); return []; }
  return (data || []).map((s: Record<string, unknown>) => {
    const drivers = s.drivers as Record<string, unknown> | null;
    const orders = s.orders as Record<string, unknown> | null;
    const companies = orders?.companies as Record<string, unknown> | null;
    const driverRate = (s.driver_rate as number) || 14;
    const hrs = (s.hours_done as number) || 0;
    const coRate = (orders?.company_rate as number) || 0;
    return {
      id: s.id as number,
      driver_id: s.driver_id as number,
      driver_name: drivers ? `${drivers.first_name} ${drivers.last_name}` : '',
      company_id: (orders?.company_id as number) || 0,
      company_name: (companies?.name as string) || '',
      order_ref: (orders?.order_ref as string) || '',
      start_datetime: (orders?.start_datetime as string) || '',
      hours_done: hrs,
      driver_pay: hrs * driverRate,
      billed: hrs * coRate,
      margin: hrs * (coRate - driverRate),
      status: (s.status as string) || 'assigned',
    };
  }) as Shift[];
}

// ═══════ COMPLIANCE ═══════

export async function fetchCompliance(): Promise<ComplianceAlert[]> {
  if (USE_DEMO) return DEMO_COMPLIANCE;
  // In production: query drivers for expiring CPC, visa, licence; companies for contract renewals
  const alerts: ComplianceAlert[] = [];
  const { data: drivers } = await supabase()
    .from('drivers').select('id, first_name, last_name, cpc_expiry, rtw_type, rtw_expiry');
  (drivers || []).forEach((d: Record<string, unknown>) => {
    if (d.cpc_expiry) alerts.push({ id: alerts.length + 1, alert_type: d.cpc_expiry && new Date(d.cpc_expiry as string) < new Date() ? 'CPC card expired' : 'CPC expiring', driver_id: d.id as number, driver_name: `${d.first_name} ${d.last_name}`, expiry_date: d.cpc_expiry as string });
    if (d.rtw_type !== 'passport' && d.rtw_expiry) alerts.push({ id: alerts.length + 1, alert_type: 'Visa expiring', driver_id: d.id as number, driver_name: `${d.first_name} ${d.last_name}`, expiry_date: d.rtw_expiry as string });
  });
  return alerts.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
}

// ═══════ ACTIVITY LOG ═══════

export async function fetchActivity(entityType?: string, entityId?: number): Promise<ActivityItem[]> {
  if (USE_DEMO) {
    if (entityType && entityId) return DEMO_ACTIVITY.filter(a => a.entity_type === entityType && a.entity_id === entityId);
    return DEMO_ACTIVITY;
  }
  let query = supabase().from('activity_log').select('*').order('performed_at', { ascending: false }).limit(50);
  if (entityType) query = query.eq('entity_type', entityType);
  if (entityId) query = query.eq('entity_id', entityId);
  const { data, error } = await query;
  if (error) { console.error('fetchActivity error:', error); return []; }
  return data || [];
}

export async function logActivity(item: Partial<ActivityItem>): Promise<void> {
  if (USE_DEMO) return;
  const { error } = await supabase().from('activity_log').insert(item as never);
  if (error) console.error('logActivity error:', error);
}

// ═══════ DOCUMENTS / STORAGE ═══════

export async function uploadDocument(
  entityType: string,
  entityId: number,
  docType: string,
  file: File
): Promise<string | null> {
  if (USE_DEMO) return `demo_${file.name}`;
  const path = `${entityType}/${entityId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase().storage.from('documents').upload(path, file);
  if (uploadError) { console.error('Upload error:', uploadError); return null; }

  const { error: dbError } = await supabase().from('documents').insert({
    entity_type: entityType,
    entity_id: entityId,
    doc_type: docType,
    file_name: file.name,
    storage_path: path,
    mime_type: file.type,
    file_size: file.size,
  } as never);
  if (dbError) console.error('Doc record error:', dbError);
  return path;
}

export async function fetchDocuments(entityType: string, entityId: number) {
  if (USE_DEMO) return [];
  const { data, error } = await supabase()
    .from('documents')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('uploaded_at', { ascending: false });
  if (error) { console.error('fetchDocuments error:', error); return []; }
  return data || [];
}

export function getDocumentUrl(storagePath: string): string {
  if (USE_DEMO) return '#';
  const { data } = supabase().storage.from('documents').getPublicUrl(storagePath);
  return data?.publicUrl || '#';
}

// ═══════ DASHBOARD STATS ═══════

export async function fetchDashboardStats() {
  if (USE_DEMO) {
    return {
      totalDrivers: DEMO_DRIVERS.length,
      activeCompanies: DEMO_COMPANIES.length,
      openOrders: DEMO_ORDERS.filter(o => o.status === 'draft' || o.status === 'active').length,
      revenueThisMonth: 9340,
      pendingFromCompanies: DEMO_INVOICES.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0),
      payrollDue: DEMO_DRIVERS.reduce((s, d) => s + (d.pending_pay || 0), 0),
    };
  }
  const [drivers, companies, orders, invoices] = await Promise.all([
    supabase().from('drivers').select('id', { count: 'exact', head: true }),
    supabase().from('companies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase().from('orders').select('id', { count: 'exact', head: true }).in('status', ['draft', 'active']),
    supabase().from('invoices').select('amount, status'),
  ]);

  const pendingFromCompanies = ((invoices.data || []) as { amount: number; status: string }[])
    .filter(i => i.status !== 'paid')
    .reduce((s, i) => s + i.amount, 0);

  return {
    totalDrivers: drivers.count || 0,
    activeCompanies: companies.count || 0,
    openOrders: orders.count || 0,
    revenueThisMonth: 0, // compute from payments
    pendingFromCompanies,
    payrollDue: 0, // compute from order_drivers
  };
}
