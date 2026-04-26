'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { DEMO_DRIVERS, DEMO_COMPANIES, DEMO_ORDERS, DEMO_INVOICES, DEMO_PAYMENTS, DEMO_COMPLIANCE } from '@/lib/demo-data';
import { fmt, fmtDate } from '@/lib/helpers';

Chart.register(...registerables);

export default function DashboardPage() {
  const revenueRef = useRef<HTMLCanvasElement>(null);
  const catRef = useRef<HTMLCanvasElement>(null);
  const chartRevRef = useRef<Chart | null>(null);
  const chartCatRef = useRef<Chart | null>(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const totalDrivers = DEMO_DRIVERS.length;
  const activeCompanies = DEMO_COMPANIES.length;
  const openOrders = DEMO_ORDERS.filter(o => o.status === 'draft' || o.status === 'active').length;
  const pendingFromCo = DEMO_INVOICES.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);
  const payrollDue = DEMO_DRIVERS.reduce((s, d) => s + (d.pending_pay || 0), 0);
  const revenueIn = DEMO_PAYMENTS.filter(p => p.direction === 'in').reduce((s, p) => s + p.amount, 0);

  const recentDrivers = [...DEMO_DRIVERS].reverse().slice(0, 3);
  
  const activeAlerts = DEMO_COMPLIANCE.filter(a => {
    if (a.driver_id) return DEMO_DRIVERS.some(d => d.id === a.driver_id);
    if (a.company_id) return DEMO_COMPANIES.some(c => c.id === a.company_id);
    return true;
  }).slice(0, 3);

  const payrollDrivers = DEMO_DRIVERS.filter(d => (d.pending_pay || 0) > 0).slice(0, 3);

  // Compute licence category distribution from actual drivers
  const licCounts: Record<string, number> = {};
  DEMO_DRIVERS.forEach(d => { if (d.licence_category) licCounts[d.licence_category] = (licCounts[d.licence_category] || 0) + 1; });
  const licLabels = Object.keys(licCounts);
  const licData = Object.values(licCounts);
  const licColors = ['#E8460A', '#185fa5', '#2d7a3a', '#888', '#c93a08', '#6b21a8'];
  const totalLic = licData.reduce((a, b) => a + b, 0) || 1;

  useEffect(() => {
    const mkO = () => ({
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,.055)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 10 } }, border: { display: false } },
        y: { grid: { color: 'rgba(0,0,0,.055)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 10 } }, border: { display: false } }
      }
    });

    if (revenueRef.current && !chartRevRef.current) {
      // Build revenue chart from real payment data
      const monthlyRev: Record<string, number> = {};
      DEMO_PAYMENTS.filter(p => p.direction === 'in').forEach(p => {
        const d = new Date(p.pay_date);
        const key = d.toLocaleDateString('en-GB', { month: 'short' });
        monthlyRev[key] = (monthlyRev[key] || 0) + p.amount;
      });
      const labels = Object.keys(monthlyRev).length > 0 ? Object.keys(monthlyRev) : ['No data'];
      const vals = Object.values(monthlyRev).length > 0 ? Object.values(monthlyRev) : [0];

      chartRevRef.current = new Chart(revenueRef.current, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Revenue', data: vals, backgroundColor: '#E8460A', borderRadius: 4, borderSkipped: false }] },
        options: { ...mkO(), scales: { ...mkO().scales, y: { ...mkO().scales.y, ticks: { ...mkO().scales.y.ticks, callback: (v: string | number) => '£' + v } } } } as never
      });
    }
    if (catRef.current && !chartCatRef.current) {
      chartCatRef.current = new Chart(catRef.current, {
        type: 'doughnut',
        data: { labels: licLabels.length > 0 ? licLabels : ['No drivers'], datasets: [{ data: licData.length > 0 ? licData : [1], backgroundColor: licLabels.length > 0 ? licColors.slice(0, licLabels.length) : ['#ddd'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }
    return () => { chartRevRef.current?.destroy(); chartRevRef.current = null; chartCatRef.current?.destroy(); chartCatRef.current = null; };
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="page-title">Dashboard</div>
        <div className="tbar-right">
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{dateStr}</span>
          <Link href="/orders" className="btn btn-primary btn-sm">+ New order</Link>
        </div>
      </div>
      <div className="content">
        <div className="g6">
          <Link href="/drivers" className="mcard"><div className="mcard-label">Total drivers</div><div className="mcard-val">{totalDrivers}</div><div className="mcard-sub" style={{ color: totalDrivers > 0 ? 'var(--green-mid)' : undefined }}>{totalDrivers > 0 ? `${totalDrivers} registered` : 'None yet'}</div></Link>
          <Link href="/companies" className="mcard"><div className="mcard-label">Active companies</div><div className="mcard-val">{activeCompanies}</div><div className="mcard-sub">{activeCompanies > 0 ? `${activeCompanies} active` : 'None yet'}</div></Link>
          <Link href="/orders" className="mcard"><div className="mcard-label">Open orders</div><div className="mcard-val va">{openOrders}</div><div className="mcard-sub">{openOrders > 0 ? `${openOrders} in progress` : 'No open orders'}</div></Link>
          <Link href="/payments" className="mcard"><div className="mcard-label">Revenue (in)</div><div className="mcard-val vg">£{fmt(revenueIn)}</div><div className="mcard-sub" style={{ color: revenueIn > 0 ? 'var(--green-mid)' : undefined }}>{revenueIn > 0 ? 'From company payments' : 'No payments yet'}</div></Link>
          <Link href="/invoices" className="mcard"><div className="mcard-label">Pending from co.</div><div className="mcard-val va">£{fmt(pendingFromCo)}</div><div className="mcard-sub">{DEMO_INVOICES.filter(i => i.status !== 'paid').length} invoices outstanding</div></Link>
          <Link href="/payments" className="mcard"><div className="mcard-label">Payroll due</div><div className="mcard-val vr">£{fmt(payrollDue)}</div><div className="mcard-sub">{payrollDrivers.length > 0 ? `${payrollDrivers.length} drivers pending` : 'All clear'}</div></Link>
        </div>

        <div className="g2">
          <div className="card"><div className="card-title">Revenue — from payments</div><div style={{ position: 'relative', height: '175px' }}><canvas ref={revenueRef}></canvas></div></div>
          <div className="card"><div className="card-title">Drivers by licence category</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {licLabels.map((l, i) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text2)' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: licColors[i] }}></div>{l} — {Math.round(licData[i] / totalLic * 100)}%</div>
              ))}
              {licLabels.length === 0 && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>No drivers yet</div>}
            </div>
            <div style={{ position: 'relative', height: '140px' }}><canvas ref={catRef}></canvas></div>
          </div>
        </div>

        <div className="g3">
          {/* New drivers */}
          <div className="card">
            <div className="ch"><span className="card-title">Recent drivers</span><Link href="/drivers" className="lnk" style={{ fontSize: '12px' }}>All →</Link></div>
            {recentDrivers.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No drivers added yet</div>}
            {recentDrivers.map(d => (
              <Link href={`/drivers/${d.id}`} key={d.id} className="lr clickable">
                <div className="av av-m" style={{ background: d.avatar_color, color: d.avatar_text_color }}>{d.initials}</div>
                <div className="lr-info"><div className="lr-name">{d.first_name} {d.last_name}</div><div className="lr-meta">{d.licence_category || 'No licence'} · {fmtDate(d.created_at)}</div></div>
                <span className={`badge badge-${d.status === 'active' ? 'green' : d.status === 'available' ? 'blue' : 'amber'}`}>{d.status}</span>
              </Link>
            ))}
          </div>

          {/* Expiry alerts */}
          <div className="card">
            <div className="ch"><span className="card-title">Expiry alerts</span><Link href="/compliance" className="lnk" style={{ fontSize: '12px' }}>All →</Link></div>
            {activeAlerts.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No alerts — all clear ✓</div>}
            {activeAlerts.map(a => (
              <div className="lr" key={a.id}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.alert_type.toLowerCase().includes('expired') ? 'var(--red)' : 'var(--amber)', flexShrink: 0, marginTop: '4px' }}></div>
                <div className="lr-info">
                  <div className="lr-name">{a.alert_type.split(' ')[0]} — {a.driver_name || a.company_name}</div>
                  <div className="lr-meta">{fmtDate(a.expiry_date)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Payroll due */}
          <div className="card">
            <div className="ch"><span className="card-title">Payroll due</span><Link href="/payments" className="lnk" style={{ fontSize: '12px' }}>All →</Link></div>
            {payrollDrivers.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No payroll pending ✓</div>}
            {payrollDrivers.map(d => (
              <Link href={`/drivers/${d.id}`} key={d.id} className="lr clickable">
                <div className="av av-m" style={{ background: d.avatar_color, color: d.avatar_text_color }}>{d.initials}</div>
                <div className="lr-info"><div className="lr-name">{d.first_name} {d.last_name}</div><div className="lr-meta">{d.total_shifts || 0} shifts</div></div>
                <div className="lr-amt va">£{fmt(d.pending_pay)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
