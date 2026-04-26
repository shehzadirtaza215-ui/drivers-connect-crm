'use client';

import { useEffect, useState, ReactNode } from 'react';
import { DEMO_DRIVERS, DEMO_COMPANIES, DEMO_ORDERS, DEMO_INVOICES, DEMO_PAYMENTS, DEMO_SHIFTS, DEMO_COMPLIANCE, DEMO_ACTIVITY } from '@/lib/demo-data';
import { fetchDrivers, fetchCompanies, fetchOrders, fetchInvoices, fetchPayments, fetchShifts, fetchCompliance, fetchActivity } from '@/lib/data';

export default function GlobalLoader({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [drivers, companies, orders, invoices, payments, shifts, compliance, activity] = await Promise.all([
          fetchDrivers(),
          fetchCompanies(),
          fetchOrders(),
          fetchInvoices(),
          fetchPayments(),
          fetchShifts(),
          fetchCompliance(),
          fetchActivity()
        ]);

        DEMO_DRIVERS.length = 0; DEMO_DRIVERS.push(...drivers);
        DEMO_COMPANIES.length = 0; DEMO_COMPANIES.push(...companies);
        DEMO_ORDERS.length = 0; DEMO_ORDERS.push(...orders);
        DEMO_INVOICES.length = 0; DEMO_INVOICES.push(...invoices);
        DEMO_PAYMENTS.length = 0; DEMO_PAYMENTS.push(...payments);
        DEMO_SHIFTS.length = 0; DEMO_SHIFTS.push(...shifts);
        DEMO_COMPLIANCE.length = 0; DEMO_COMPLIANCE.push(...compliance);
        DEMO_ACTIVITY.length = 0; DEMO_ACTIVITY.push(...activity);
      } catch (err) {
        console.error("Failed to load global data from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: 'var(--text2)', fontWeight: 500 }}>Connecting to Database...</div>
      </div>
    );
  }

  return <>{children}</>;
}
