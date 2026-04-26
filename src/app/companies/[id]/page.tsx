'use client';

import Link from 'next/link';
import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Chart, registerables } from 'chart.js';
import { fetchCompany, deleteCompany } from '@/lib/data';
import { DEMO_DRIVERS, DEMO_ACTIVITY, DEMO_ORDERS } from '@/lib/demo-data';
import { fmt, fmtDate, sBadge } from '@/lib/helpers';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import FormField from '@/components/ui/FormField';

Chart.register(...registerables);

export default function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [co, setCompany] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);
  const tabs = ['Finance', 'All orders', 'Drivers', 'Invoices', 'Activity log'];

  useEffect(() => {
    fetchCompany(Number(id)).then(setCompany);
  }, [id]);


  const companyDrivers = DEMO_DRIVERS.filter(d => d.id <= 3);

  useEffect(() => {
    if (activeTab === 0 && chartRef.current && !chartInst.current) {
      chartInst.current = new Chart(chartRef.current, {
        type: 'bar', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr'], datasets: [
          { label: 'Billed', data: [800, 1200, 2000, 1600], backgroundColor: '#E8460A', borderRadius: 4, borderSkipped: false },
          { label: 'Received', data: [800, 1200, 1200, 1000], backgroundColor: '#2d7a3a', borderRadius: 4, borderSkipped: false }
        ] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 10 } }, border: { display: false } }, y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 10 }, callback: (v: string | number) => '£' + v }, border: { display: false } } } }
      });
    }
    return () => { if (activeTab !== 0) { chartInst.current?.destroy(); chartInst.current = null; } };
  }, [activeTab]);

  if (!co) return <div style={{ padding: '20px' }}>Loading company...</div>;

  const companyOrders = DEMO_ORDERS.filter((o: any) => o.company_id === co.id).map((o: any) => ({
    ref: o.order_ref, driver: o.driver_names || 'Unassigned', dId: 1, date: o.start_datetime ? fmtDate(o.start_datetime) : '-', hours: o.hours_done ? `${o.hours_done}h` : '-', cost: o.hours_done && o.company_rate ? `£${(o.hours_done * o.company_rate * 0.75).toFixed(2)}` : '-', billed: o.hours_done && o.company_rate ? `£${(o.hours_done * o.company_rate).toFixed(2)}` : '-', margin: o.hours_done && o.company_rate ? `£${(o.hours_done * o.company_rate * 0.25).toFixed(2)}` : '-', status: o.status
  }));

  function showEditCompany() {
    openModal(`Edit company — ${co.name}`,
      <div>
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)', borderRadius: '10px', padding: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#fff', border: '2px solid rgba(255,255,255,0.3)' }}>{co.code}</div>
          <div><div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Edit company profile</div><div style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>{co.name}</div></div>
        </div>
        <div className="form-grid"><FormField label="Company code" id="cf-code" value={co.code} required /><FormField label="Full name" id="cf-name" value={co.name} required /></div>
        <FormField label="Address" id="cf-addr" value={co.address} />
        <div className="form-grid"><FormField label="Contact name" id="cf-cn" value={co.contact_name} /><FormField label="Contact email" id="cf-ce" type="email" value={co.contact_email} /><FormField label="Contact phone" id="cf-cp" type="tel" value={co.contact_phone} /></div>
        <div className="form-grid"><FormField label="Licence required" id="cf-lic" value={co.licence_required} options={[{ v: '', l: 'Any' }, { v: 'Class 1', l: 'Class 1' }, { v: 'Class 2', l: 'Class 2' }, { v: '7.5T', l: '7.5T' }]} /><FormField label="Rate (£/hr)" id="cf-rate" type="number" value={co.rate_per_hour} /><FormField label="Payment terms (days)" id="cf-terms" type="number" value={co.payment_terms_days} /></div>
      </div>,
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        <button className="btn btn-sm" style={{ color: 'var(--red)', background: 'rgba(232, 70, 10, 0.08)' }} onClick={async () => {
          await deleteCompany(co.id);
          toast('Company deleted ✓');
          closeModal();
          router.push('/companies');
        }}>Delete company</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary btn-sm" style={{ minWidth: '130px' }} onClick={() => { toast('Company updated ✓'); closeModal(); }}>Save changes</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="breadcrumb"><Link href="/companies" className="bc-link">Companies</Link><span className="bc-sep">›</span><span>{co.name}</span></div>
        <div className="tbar-right"><button className="btn btn-sm" onClick={showEditCompany}>Edit</button><button className="btn btn-primary btn-sm">+ Create order</button></div>
      </div>
      <div className="content">
        <div className="phero">
          <div className="av av-xl sq-lg" style={{ background: co.avatar_color, color: co.avatar_text_color, fontSize: '13px', fontWeight: 800 }}>{co.code}</div>
          <div className="phero-info">
            <div className="phero-name">{co.name}</div>
            <div className="phero-meta">{co.contact_name} · {co.contact_email} · {co.contact_phone}</div>
            <div className="phero-badges"><span className="badge badge-green">Active</span>{co.licence_required && <span className="badge badge-blue">{co.licence_required} required</span>}<span className="badge badge-gray">£{co.rate_per_hour}/hr</span></div>
            <div className="phero-stats">
              <div className="ps"><div className="ps-label">Orders</div><div className="ps-val">{co.total_orders}</div></div>
              <div className="ps"><div className="ps-label">Hours</div><div className="ps-val">{fmt(co.total_hours)}h</div></div>
              <div className="ps"><div className="ps-label">Billed</div><div className="ps-val" style={{ color: 'var(--green-mid)' }}>£{fmt(co.total_billed)}</div></div>
              <div className="ps"><div className="ps-label">Received</div><div className="ps-val" style={{ color: 'var(--green-mid)' }}>£{fmt(co.total_paid)}</div></div>
              <div className="ps"><div className="ps-label">Outstanding</div><div className="ps-val" style={{ color: 'var(--red)' }}>£{fmt(co.outstanding)}</div></div>
            </div>
          </div>
        </div>
        <div className="tabs">{tabs.map((t, i) => (<div key={t} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>))}</div>

        {activeTab === 0 && (
          <div className="g2">
            <div className="card"><div className="card-title">Revenue — billed vs received</div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#E8460A' }}></div>Billed</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#2d7a3a' }}></div>Received</div>
              </div>
              <div style={{ position: 'relative', height: '160px' }}><canvas ref={chartRef}></canvas></div>
            </div>
            <div className="card"><div className="card-title">Company details</div>
              {[['Contact', co.contact_name], ['Email', co.contact_email], ['Phone', co.contact_phone], ['Address', co.address], ['Rate', `£${co.rate_per_hour}/hr`], ['Terms', `${co.payment_terms_days} days`], ['Licence', co.licence_required || 'Any']].map(([l, v]) => (
                <div className="lr" key={l as string}><span style={{ flex: 1, fontSize: '11.5px', color: 'var(--text3)' }}>{l}</span><span style={{ fontWeight: 500 }}>{v || '—'}</span></div>
              ))}
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary btn-sm" onClick={showEditCompany}>Edit company</button></div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="dt">
              <thead><tr><th style={{ paddingLeft: '14px' }}>Order</th><th>Driver</th><th>Date</th><th>Hours</th><th>Cost</th><th>Billed</th><th>Margin</th><th>Status</th></tr></thead>
              <tbody>
                {companyOrders.map(o => (
                  <tr key={o.ref}>
                    <td style={{ paddingLeft: '14px' }}><span className="lnk mono">{o.ref}</span></td>
                    <td><Link href={`/drivers/${o.dId}`} className="lnk">{o.driver}</Link></td>
                    <td>{o.date}</td><td>{o.hours}</td><td>{o.cost}</td><td style={{ fontWeight: 600 }}>{o.billed}</td>
                    <td style={{ color: 'var(--green-mid)', fontWeight: 600 }}>{o.margin}</td>
                    <td><span className={`badge badge-${sBadge(o.status)}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 2 && (
          <div className="card">
            {companyDrivers.map(dr => (
              <Link href={`/drivers/${dr.id}`} key={dr.id} className="lr clickable">
                <div className="av av-m" style={{ background: dr.avatar_color, color: dr.avatar_text_color }}>{dr.initials}</div>
                <div className="lr-info"><div className="lr-name">{dr.first_name} {dr.last_name}</div><div className="lr-meta">{dr.licence_category} · {dr.total_shifts} orders · {fmt(dr.total_hours)}h</div></div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginRight: '10px' }}>£{fmt(dr.total_earned)} earned</div>
                <span className={`badge badge-${sBadge(dr.status)}`}>{dr.status}</span>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 3 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="dt">
              <thead><tr><th style={{ paddingLeft: '14px' }}>Invoice</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td style={{ paddingLeft: '14px' }} className="mono">INV-2026-018</td><td>11 Apr</td><td style={{ color: 'var(--red)' }}>14 Apr</td><td style={{ fontWeight: 700 }}>£1,240</td><td><span className="badge badge-red">overdue</span></td></tr>
                <tr><td style={{ paddingLeft: '14px' }} className="mono">INV-2026-015</td><td>4 Apr</td><td>10 Apr</td><td style={{ fontWeight: 700 }}>£1,080</td><td><span className="badge badge-green">paid</span></td></tr>
                <tr><td style={{ paddingLeft: '14px' }} className="mono">INV-2026-010</td><td>25 Mar</td><td>1 Apr</td><td style={{ fontWeight: 700 }}>£960</td><td><span className="badge badge-green">paid</span></td></tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 4 && (
          <div className="card"><div className="card-title">Activity log</div>
            <div className="afeed">
              {DEMO_ACTIVITY.slice(0, 3).map((a, i) => (
                <div className="aitem" key={a.id}>
                  <div className="aleft"><div className="adot" style={{ background: 'var(--brand)' }}></div>{i < 2 && <div className="aline"></div>}</div>
                  <div><div className="atext">{a.action}{a.field_changed ? <> — <strong>{a.field_changed}</strong></> : ''}{a.new_value ? <> → <strong>{a.new_value}</strong></> : ''}</div><div className="atime">{fmtDate(a.performed_at)} · by {a.performed_by_name || 'System'}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
