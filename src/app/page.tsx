'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { DEMO_DRIVERS, DEMO_COMPANIES, DEMO_INVOICES, DEMO_COMPLIANCE } from '@/lib/demo-data';
import { fmt, fmtDate } from '@/lib/helpers';

Chart.register(...registerables);

export default function DashboardPage() {
  const revenueRef = useRef<HTMLCanvasElement>(null);
  const catRef = useRef<HTMLCanvasElement>(null);
  const chartRevRef = useRef<Chart | null>(null);
  const chartCatRef = useRef<Chart | null>(null);

  const [stats, setStats] = useState({
    totalDrivers: DEMO_DRIVERS.length,
    activeCompanies: DEMO_COMPANIES.length,
    openOrders: 7,
    revenueApr: 9340,
    pendingFromCo: DEMO_INVOICES.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0),
    payrollDue: 2086
  });

  const [recentDrivers, setRecentDrivers] = useState(DEMO_DRIVERS.slice(0, 3));
  const [alerts, setAlerts] = useState<any[]>([]);
  const [payrollDrivers, setPayrollDrivers] = useState<any[]>([]);

  useEffect(() => {
    // Refresh stats when component mounts (handles back navigation caching)
    setStats({
      totalDrivers: DEMO_DRIVERS.length,
      activeCompanies: DEMO_COMPANIES.length,
      openOrders: 7,
      revenueApr: 9340,
      pendingFromCo: DEMO_INVOICES.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0),
      payrollDue: DEMO_DRIVERS.reduce((s, d) => s + (d.pending_pay || 0), 0)
    });
    setRecentDrivers([...DEMO_DRIVERS].reverse().slice(0, 3));
    
    const activeAlerts = DEMO_COMPLIANCE.filter(a => {
      if (a.driver_id) return DEMO_DRIVERS.some(d => d.id === a.driver_id);
      if (a.company_id) return DEMO_COMPANIES.some(c => c.id === a.company_id);
      return true;
    });
    setAlerts(activeAlerts.slice(0, 3));
    
    setPayrollDrivers(DEMO_DRIVERS.filter(d => (d.pending_pay || 0) > 0).slice(0, 3));

    const mkO = () => ({
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,.055)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 10 } }, border: { display: false } },
        y: { grid: { color: 'rgba(0,0,0,.055)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 10 } }, border: { display: false } }
      }
    });

    if (revenueRef.current && !chartRevRef.current) {
      chartRevRef.current = new Chart(revenueRef.current, {
        type: 'bar',
        data: { labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'], datasets: [{ label: 'Revenue', data: [4200, 5100, 6800, 7200, 8340, 9340], backgroundColor: '#E8460A', borderRadius: 4, borderSkipped: false }] },
        options: { ...mkO(), scales: { ...mkO().scales, y: { ...mkO().scales.y, ticks: { ...mkO().scales.y.ticks, callback: (v: string | number) => '£' + v } } } } as never
      });
    }
    if (catRef.current && !chartCatRef.current) {
      chartCatRef.current = new Chart(catRef.current, {
        type: 'doughnut',
        data: { labels: ['Class 1', 'Class 2', '7.5T', 'Van'], datasets: [{ data: [42, 31, 18, 9], backgroundColor: ['#E8460A', '#185fa5', '#2d7a3a', '#888'] }] },
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
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Sat 18 Apr 2026</span>
          <Link href="/orders" className="btn btn-primary btn-sm">+ New order</Link>
        </div>
      </div>
      <div className="content">
        <div className="g6">
          <Link href="/drivers" className="mcard"><div className="mcard-label">Total drivers</div><div className="mcard-val">{stats.totalDrivers}</div><div className="mcard-sub" style={{ color: 'var(--green-mid)' }}>+3 this month</div></Link>
          <Link href="/companies" className="mcard"><div className="mcard-label">Active companies</div><div className="mcard-val">{stats.activeCompanies}</div><div className="mcard-sub">2 pending setup</div></Link>
          <Link href="/orders" className="mcard"><div className="mcard-label">Open orders</div><div className="mcard-val va">{stats.openOrders}</div><div className="mcard-sub">2 starting today</div></Link>
          <Link href="/payments" className="mcard"><div className="mcard-label">Revenue Apr</div><div className="mcard-val vg">£{fmt(stats.revenueApr)}</div><div className="mcard-sub" style={{ color: 'var(--green-mid)' }}>+12% vs Mar</div></Link>
          <Link href="/invoices" className="mcard"><div className="mcard-label">Pending from co.</div><div className="mcard-val va">£{fmt(stats.pendingFromCo)}</div><div className="mcard-sub">4 invoices out</div></Link>
          <Link href="/payments" className="mcard"><div className="mcard-label">Payroll due</div><div className="mcard-val vr">£{fmt(stats.payrollDue)}</div><div className="mcard-sub">Due 25 Apr</div></Link>
        </div>

        <div className="g2">
          <div className="card"><div className="card-title">Revenue — last 6 months</div><div style={{ position: 'relative', height: '175px' }}><canvas ref={revenueRef}></canvas></div></div>
          <div className="card"><div className="card-title">Shifts by licence category</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text2)' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#E8460A' }}></div>Class 1 — 42%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text2)' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#185fa5' }}></div>Class 2 — 31%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text2)' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#2d7a3a' }}></div>7.5T — 18%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text2)' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#888' }}></div>Van — 9%</div>
            </div>
            <div style={{ position: 'relative', height: '140px' }}><canvas ref={catRef}></canvas></div>
          </div>
        </div>

        <div className="g3">
          {/* New drivers */}
          <div className="card">
            <div className="ch"><span className="card-title">New drivers</span><Link href="/drivers" className="lnk" style={{ fontSize: '12px' }}>All →</Link></div>
            {recentDrivers.map(d => (
              <Link href={`/drivers/${d.id}`} key={d.id} className="lr clickable">
                <div className="av av-m" style={{ background: d.avatar_color, color: d.avatar_text_color }}>{d.initials}</div>
                <div className="lr-info"><div className="lr-name">{d.first_name} {d.last_name}</div><div className="lr-meta">{d.licence_category} · 2 days ago</div></div>
                <span className={`badge badge-${d.status === 'active' ? 'green' : 'amber'}`}>{d.status === 'active' ? 'Active' : 'Docs pend.'}</span>
              </Link>
            ))}
          </div>

          {/* Expiry alerts */}
          <div className="card">
            <div className="ch"><span className="card-title">Expiry alerts</span><Link href="/compliance" className="lnk" style={{ fontSize: '12px' }}>All →</Link></div>
            {alerts.map(a => (
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
            <div className="ch"><span className="card-title">Payroll due 25 Apr</span><Link href="/payments" className="lnk" style={{ fontSize: '12px' }}>All →</Link></div>
            {payrollDrivers.map(d => (
              <Link href={`/drivers/${d.id}`} key={d.id} className="lr clickable">
                <div className="av av-m" style={{ background: d.avatar_color, color: d.avatar_text_color }}>{d.initials}</div>
                <div className="lr-info"><div className="lr-name">{d.first_name} {d.last_name}</div><div className="lr-meta">{d.total_hours ? Math.round(d.total_hours / 8) + 'h' : ''}</div></div>
                <div className="lr-amt va">£{fmt(d.pending_pay)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
