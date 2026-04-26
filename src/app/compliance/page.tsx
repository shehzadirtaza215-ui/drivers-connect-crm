'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchCompliance } from '@/lib/data';
import { fmtDate, isExp, dLeft } from '@/lib/helpers';
import type { ComplianceAlert } from '@/lib/types';

export default function CompliancePage() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompliance().then(data => {
      setAlerts(data);
      setLoading(false);
    });
  }, []);

  const expired = alerts.filter(a => isExp(a.expiry_date)).length;
  const expiringSoon = alerts.filter(a => !isExp(a.expiry_date) && (dLeft(a.expiry_date) || 999) <= 30).length;
  const allClear = alerts.filter(a => !isExp(a.expiry_date) && (dLeft(a.expiry_date) || 999) > 30).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: 'var(--text2)', fontWeight: 500 }}>Loading compliance...</div>
      </div>
    );
  }

  return (
    <>
      <div className="topbar"><div className="page-title">Compliance</div></div>
      <div className="content">
        <div className="g4" style={{ marginBottom: '16px' }}>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">All clear</div><div className="mcard-val vg">{allClear}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Expiring soon</div><div className="mcard-val va">{expiringSoon}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Expired</div><div className="mcard-val vr">{expired}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Total alerts</div><div className="mcard-val">{alerts.length}</div></div>
        </div>
        <div className="card">
          <div className="card-title">All expiry alerts</div>
          {alerts.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No compliance alerts — all clear ✓</div>}
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
