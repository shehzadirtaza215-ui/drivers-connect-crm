'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DEMO_COMPLIANCE, DEMO_DRIVERS, DEMO_COMPANIES } from '@/lib/demo-data';
import { fmtDate, isExp, dLeft } from '@/lib/helpers';

export default function CompliancePage() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    setAlerts(DEMO_COMPLIANCE.filter(a => {
      if (a.driver_id) return DEMO_DRIVERS.some(d => d.id === a.driver_id);
      if (a.company_id) return DEMO_COMPANIES.some(c => c.id === a.company_id);
      return true;
    }));
  }, []);

  const expired = alerts.filter(a => isExp(a.expiry_date)).length;
  const expiringSoon = alerts.filter(a => !isExp(a.expiry_date) && (dLeft(a.expiry_date) || 999) <= 30).length;

  return (
    <>
      <div className="topbar"><div className="page-title">Compliance</div></div>
      <div className="content">
        <div className="g4" style={{ marginBottom: '16px' }}>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">All clear</div><div className="mcard-val vg">18</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Expiring soon</div><div className="mcard-val va">{expiringSoon}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Expired</div><div className="mcard-val vr">{expired}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Missing docs</div><div className="mcard-val va">3</div></div>
        </div>
        <div className="card">
          <div className="card-title">All expiry alerts</div>
          {alerts.map(a => {
            const exp = isExp(a.expiry_date);
            const days = dLeft(a.expiry_date);
            return (
              <div className="lr" key={a.id} style={{ alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: exp ? 'var(--red)' : days && days <= 21 ? 'var(--amber)' : 'var(--blue)', flexShrink: 0, marginTop: '5px' }}></div>
                <div className="lr-info">
                  <div className="lr-name">{a.alert_type} — {a.driver_name || a.company_name}</div>
                  <div className="lr-meta">{exp ? `Expired ${fmtDate(a.expiry_date)}` : `Expires ${fmtDate(a.expiry_date)}${days != null ? ` · ${days} days remaining` : ''}`}</div>
                </div>
                {a.driver_id && <Link href={`/drivers/${a.driver_id}`} className="btn btn-sm">View driver →</Link>}
                {a.company_id && <Link href={`/companies/${a.company_id}`} className="btn btn-sm">View company →</Link>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
