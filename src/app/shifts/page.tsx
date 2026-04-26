'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DEMO_SHIFTS, DEMO_DRIVERS, DEMO_COMPANIES } from '@/lib/demo-data';
import { fmt, fmtDate, sBadge } from '@/lib/helpers';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    setShifts(DEMO_SHIFTS.filter(s => 
      DEMO_DRIVERS.some(d => d.id === s.driver_id) && 
      DEMO_COMPANIES.some(c => c.id === s.company_id)
    ));
  }, []);
  return (
    <>
      <div className="topbar"><div className="page-title">Shifts</div></div>
      <div className="content">
        <div className="g4" style={{ marginBottom: '16px' }}>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Shifts this week</div><div className="mcard-val">14</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Hours this week</div><div className="mcard-val">118h</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Revenue (week)</div><div className="mcard-val vg">£2,360</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Margin (week)</div><div className="mcard-val vg">£708</div></div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="dt">
            <thead><tr><th style={{ paddingLeft: '14px' }}>Driver</th><th>Company</th><th>Order</th><th>Date</th><th>Hours</th><th>Driver pay</th><th>Co. charge</th><th>Profit</th><th>Status</th></tr></thead>
            <tbody>
              {shifts.map(s => (
                <tr key={s.id}>
                  <td style={{ paddingLeft: '14px' }}><Link href={`/drivers/${s.driver_id}`} className="lnk">{s.driver_name}</Link></td>
                  <td><Link href={`/companies/${s.company_id}`} className="lnk">{s.company_name}</Link></td>
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
