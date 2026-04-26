'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DEMO_SHIFTS, DEMO_DRIVERS, DEMO_COMPANIES, DEMO_ORDERS } from '@/lib/demo-data';
import { fmt, fmtDate, sBadge } from '@/lib/helpers';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    // Build shifts from completed/active orders that have assigned drivers
    const realShifts = DEMO_ORDERS
      .filter(o => o.driver_names && (o.status === 'completed' || o.status === 'active'))
      .map(o => {
        const co = DEMO_COMPANIES.find(c => c.id === o.company_id);
        const driverRate = (o.company_rate || 0) * 0.75;
        return {
          id: o.id,
          driver_id: 0,
          driver_name: o.driver_names || 'Unknown',
          company_id: o.company_id,
          company_name: co?.name || o.company_name || 'Unknown',
          order_ref: o.order_ref,
          start_datetime: o.start_datetime,
          hours_done: o.hours_done || 0,
          driver_pay: (o.hours_done || 0) * driverRate,
          billed: (o.hours_done || 0) * (o.company_rate || 0),
          margin: (o.hours_done || 0) * ((o.company_rate || 0) - driverRate),
          status: o.status,
        };
      });
    setShifts(realShifts);
  }, []);

  const totalShifts = shifts.length;
  const totalHours = shifts.reduce((s, sh) => s + (sh.hours_done || 0), 0);
  const totalRevenue = shifts.reduce((s, sh) => s + (sh.billed || 0), 0);
  const totalMargin = shifts.reduce((s, sh) => s + (sh.margin || 0), 0);

  return (
    <>
      <div className="topbar"><div className="page-title">Shifts</div></div>
      <div className="content">
        <div className="g4" style={{ marginBottom: '16px' }}>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Total shifts</div><div className="mcard-val">{totalShifts}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Total hours</div><div className="mcard-val">{fmt(totalHours)}h</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Revenue</div><div className="mcard-val vg">£{fmt(totalRevenue)}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Margin</div><div className="mcard-val vg">£{fmt(totalMargin)}</div></div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="dt">
            <thead><tr><th style={{ paddingLeft: '14px' }}>Driver</th><th>Company</th><th>Order</th><th>Date</th><th>Hours</th><th>Driver pay</th><th>Co. charge</th><th>Profit</th><th>Status</th></tr></thead>
            <tbody>
              {shifts.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No shifts recorded yet</td></tr>}
              {shifts.map(s => (
                <tr key={s.id}>
                  <td style={{ paddingLeft: '14px' }}>{s.driver_name}</td>
                  <td>{s.company_name}</td>
                  <td><span className="lnk mono">{s.order_ref}</span></td>
                  <td>{fmtDate(s.start_datetime)}</td>
                  <td>{fmt(s.hours_done)}h</td>
                  <td>£{fmt(s.driver_pay)}</td>
                  <td>£{fmt(s.billed)}</td>
                  <td style={{ color: 'var(--green-mid)', fontWeight: 600 }}>£{fmt(s.margin)}</td>
                  <td><span className={`badge badge-${sBadge(s.status)}`}>{s.status === 'active' ? 'Live' : s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
