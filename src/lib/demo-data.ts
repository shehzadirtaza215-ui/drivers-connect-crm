// Demo data store — used as a shared mutable state container.
// GlobalLoader fills these arrays from Supabase on app init.
// All arrays start EMPTY — no hardcoded dummy data.

import { Driver, Company, Order, Invoice, Payment, Shift, ComplianceAlert, ActivityItem } from './types';

export const DEMO_DRIVERS: Driver[] = [];

export const DEMO_COMPANIES: Company[] = [];

export const DEMO_ORDERS: Order[] = [];

export const DEMO_INVOICES: Invoice[] = [];

export const DEMO_PAYMENTS: Payment[] = [];

export const DEMO_SHIFTS: Shift[] = [];

export const DEMO_COMPLIANCE: ComplianceAlert[] = [];

export const DEMO_ACTIVITY: ActivityItem[] = [];
