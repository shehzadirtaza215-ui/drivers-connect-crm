'use client';

import { useState, useEffect } from 'react';
import { fetchShifts } from '@/lib/data';
import { fmt, fmtDate, sBadge } from '@/lib/helpers';
import type { Shift } from '@/lib/types';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts().then(data => { setShifts(data); setLoading(false); });
  }, []);

  const totalShifts = shifts.length;
  const totalHours = shifts.reduce((s, sh) => s + (sh.hours_done || 0), 0);
  const totalRevenue = shifts.reduce((s, sh) => s + (sh.billed || 0), 0);
  const totalMargin = shifts.reduce((s, sh) => s + (sh.margin || 0), 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}><div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style><div style={{ color: 'var(--text2)', fontWeight: 500 }}>Loading shifts...</div></div>;

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
                  <td><span className={`badge badge-${sBadge(s.status)}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
