'use client';

import Link from 'next/link';
import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Chart, registerables } from 'chart.js';
import { fetchCompany, deleteCompany, updateCompany, fetchActivity, fetchOrderDrivers, fetchInvoices, fetchPayments } from '@/lib/data';
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
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [companyShifts, setCompanyShifts] = useState<any[]>([]);
  const [companyDrivers, setCompanyDrivers] = useState<any[]>([]);
  const [companyInvoices, setCompanyInvoices] = useState<any[]>([]);
  const [companyPayments, setCompanyPayments] = useState<any[]>([]);
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);
  const tabs = ['Finance', 'All orders', 'Drivers', 'Invoices', 'Activity log'];

  useEffect(() => {
    const cId = Number(id);
    fetchCompany(cId).then(setCompany);
    fetchActivity('company', cId).then(setActivityLog);
    // Fetch order_drivers for this company to get orders + drivers
    fetchOrderDrivers({ company_id: cId }).then(ods => {
      // Build order list
      setCompanyShifts(ods.map((od: any) => ({
        id: od.id, ref: od.orders?.order_ref || '', driver: od.drivers ? `${od.drivers.first_name} ${od.drivers.last_name}` : 'Unassigned',
        driverId: od.driver_id, date: od.orders?.start_datetime ? fmtDate(od.orders.start_datetime) : '-',
        hours: od.hours_done || od.orders?.hours_done || 0, driverRate: od.driver_rate || 14, coRate: od.orders?.company_rate || 0,
        status: od.orders?.status || od.status || 'assigned',
      })));
      // Unique drivers for this company
      const seen = new Set<number>();
      const drivers: any[] = [];
      ods.forEach((od: any) => {
        if (od.drivers && !seen.has(od.drivers.id)) { seen.add(od.drivers.id); drivers.push(od.drivers); }
      });
      setCompanyDrivers(drivers);
    });
    fetchInvoices().then(invs => setCompanyInvoices(invs.filter((i: any) => i.company_id === cId)));
    fetchPayments().then(pays => setCompanyPayments(pays.filter((p: any) => p.company_id === cId)));
  }, [id]);

  // Stats from company_stats view (merged in fetchCompany)
  const totalBilled = co?.total_billed || 0;
  const totalReceived = co?.total_paid || 0;
  const outstanding = co?.outstanding || 0;

  useEffect(() => {
    if (activeTab === 0 && chartRef.current && !chartInst.current && co) {
      const months: Record<string, { billed: number; received: number }> = {};
      companyInvoices.forEach((i: any) => { const m = new Date(i.issued_date).toLocaleDateString('en-GB', { month: 'short' }); if (!months[m]) months[m] = { billed: 0, received: 0 }; months[m].billed += i.amount || 0; });
      companyPayments.filter((p: any) => p.direction === 'in').forEach((p: any) => { const m = new Date(p.pay_date).toLocaleDateString('en-GB', { month: 'short' }); if (!months[m]) months[m] = { billed: 0, received: 0 }; months[m].received += p.amount || 0; });
      const labels = Object.keys(months).length > 0 ? Object.keys(months) : ['No data'];
      const billedData = Object.values(months).length > 0 ? Object.values(months).map(v => v.billed) : [0];
      const recData = Object.values(months).length > 0 ? Object.values(months).map(v => v.received) : [0];
      chartInst.current = new Chart(chartRef.current, {
        type: 'bar', data: { labels, datasets: [{ label: 'Billed', data: billedData, backgroundColor: '#E8460A', borderRadius: 4, borderSkipped: false }, { label: 'Received', data: recData, backgroundColor: '#2d7a3a', borderRadius: 4, borderSkipped: false }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 10 } }, border: { display: false } }, y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 10 }, callback: (v: string | number) => '£' + v }, border: { display: false } } } }
      });
    }
    return () => { if (activeTab !== 0) { chartInst.current?.destroy(); chartInst.current = null; } };
  }, [activeTab, co, companyInvoices.length, companyPayments.length]);

  if (!co) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}><div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style><div style={{ color: 'var(--text2)', fontWeight: 500 }}>Loading company...</div></div>;

  function showEditCompany() {
    openModal(`Edit company — ${co.name}`,
      <div>
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)', borderRadius: '10px', padding: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#fff', border: '2px solid rgba(255,255,255,0.3)' }}>{co.code}</div>
          <div><div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Edit company profile</div><div style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>{co.name}</div></div>
        </div>
        <form id="edit-company-form" onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const updates: any = { code: fd.get('code'), name: fd.get('name'), address: fd.get('address'), contact_name: fd.get('contact_name'), contact_email: fd.get('contact_email'), contact_phone: fd.get('contact_phone'), licence_required: fd.get('licence_required'), rate_per_hour: Number(fd.get('rate_per_hour')) || 0, payment_terms_days: Number(fd.get('payment_terms_days')) || 14 }; const updated = await updateCompany(co.id, updates); if (updated) { setCompany({ ...co, ...updated }); toast('Company updated ✓'); closeModal(); } else toast('Error updating company', 'err'); }}>
          <div className="form-grid"><FormField label="Company code" id="cf-code" name="code" value={co.code} required /><FormField label="Full name" id="cf-name" name="name" value={co.name} required /></div>
          <FormField label="Address" id="cf-addr" name="address" value={co.address} />
          <div className="form-grid"><FormField label="Contact name" id="cf-cn" name="contact_name" value={co.contact_name} /><FormField label="Contact email" id="cf-ce" name="contact_email" type="email" value={co.contact_email} /><FormField label="Contact phone" id="cf-cp" name="contact_phone" type="tel" value={co.contact_phone} /></div>
          <div className="form-grid"><FormField label="Licence required" id="cf-lic" name="licence_required" value={co.licence_required} options={[{ v: '', l: 'Any' }, { v: 'Class 1', l: 'Class 1' }, { v: 'Class 2', l: 'Class 2' }, { v: '7.5T', l: '7.5T' }]} /><FormField label="Rate (£/hr)" id="cf-rate" name="rate_per_hour" type="number" value={co.rate_per_hour} /><FormField label="Payment terms (days)" id="cf-terms" name="payment_terms_days" type="number" value={co.payment_terms_days} /></div>
        </form>
      </div>,
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        <button className="btn btn-sm" style={{ color: 'var(--red)', background: 'rgba(232, 70, 10, 0.08)' }} onClick={async () => { await deleteCompany(co.id); toast('Company deleted ✓'); closeModal(); router.push('/companies'); }}>Delete company</button>
        <div style={{ display: 'flex', gap: '8px' }}><button className="btn btn-sm" onClick={closeModal}>Cancel</button><button type="submit" form="edit-company-form" className="btn btn-primary btn-sm" style={{ minWidth: '130px' }}>Save changes</button></div>
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
              <div className="ps"><div className="ps-label">Orders</div><div className="ps-val">{co.total_orders || 0}</div></div>
              <div className="ps"><div className="ps-label">Billed</div><div className="ps-val" style={{ color: 'var(--green-mid)' }}>£{fmt(totalBilled)}</div></div>
              <div className="ps"><div className="ps-label">Received</div><div className="ps-val" style={{ color: 'var(--green-mid)' }}>£{fmt(totalReceived)}</div></div>
              <div className="ps"><div className="ps-label">Outstanding</div><div className="ps-val" style={{ color: outstanding > 0 ? 'var(--red)' : 'var(--green-mid)' }}>£{fmt(Math.abs(outstanding))}</div></div>
              <div className="ps"><div className="ps-label">Drivers</div><div className="ps-val">{co.driver_count || companyDrivers.length}</div></div>
            </div>
          </div>
        </div>
        <div className="tabs">{tabs.map((t, i) => (<div key={t} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>))}</div>

        {activeTab === 0 && (
          <div className="g2">
            <div className="card"><div className="card-title">Revenue — billed vs received</div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#E8460A' }}></div>Billed</div><div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#2d7a3a' }}></div>Received</div></div>
              <div style={{ position: 'relative', height: '160px' }}><canvas ref={chartRef}></canvas></div>
            </div>
            <div className="card"><div className="card-title">Company details</div>
              {[['Contact', co.contact_name], ['Email', co.contact_email], ['Phone', co.contact_phone], ['Address', co.address], ['Rate', co.rate_per_hour ? `£${co.rate_per_hour}/hr` : '—'], ['Terms', co.payment_terms_days ? `${co.payment_terms_days} days` : '—'], ['Licence', co.licence_required || 'Any']].map(([l, v]) => (<div className="lr" key={l as string}><span style={{ flex: 1, fontSize: '11.5px', color: 'var(--text3)' }}>{l}</span><span style={{ fontWeight: 500 }}>{v || '—'}</span></div>))}
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary btn-sm" onClick={showEditCompany}>Edit company</button></div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="dt">
              <thead><tr><th style={{ paddingLeft: '14px' }}>Order</th><th>Driver</th><th>Date</th><th>Hours</th><th>Cost</th><th>Billed</th><th>Margin</th><th>Status</th></tr></thead>
              <tbody>
                {companyShifts.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No orders yet</td></tr>}
                {companyShifts.map((o: any) => { const cost = o.hours * o.driverRate; const billed = o.hours * o.coRate; return (
                  <tr key={o.id}><td style={{ paddingLeft: '14px' }}><span className="lnk mono">{o.ref}</span></td><td>{o.driver}</td><td>{o.date}</td><td>{o.hours > 0 ? `${o.hours}h` : '-'}</td><td>{cost > 0 ? `£${fmt(cost)}` : '-'}</td><td style={{ fontWeight: 600 }}>{billed > 0 ? `£${fmt(billed)}` : '-'}</td><td style={{ color: 'var(--green-mid)', fontWeight: 600 }}>{billed - cost > 0 ? `£${fmt(billed - cost)}` : '-'}</td><td><span className={`badge badge-${sBadge(o.status)}`}>{o.status}</span></td></tr>
                ); })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 2 && (
          <div className="card">
            {companyDrivers.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No drivers assigned yet</div>}
            {companyDrivers.map((dr: any) => (<Link href={`/drivers/${dr.id}`} key={dr.id} className="lr clickable"><div className="av av-m" style={{ background: dr.avatar_color, color: dr.avatar_text_color }}>{dr.initials}</div><div className="lr-info"><div className="lr-name">{dr.first_name} {dr.last_name}</div><div className="lr-meta">{dr.licence_category || '—'}</div></div><span className={`badge badge-${sBadge(dr.status)}`}>{dr.status}</span></Link>))}
          </div>
        )}

        {activeTab === 3 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="dt">
              <thead><tr><th style={{ paddingLeft: '14px' }}>Invoice</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {companyInvoices.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No invoices yet</td></tr>}
                {companyInvoices.map((inv: any) => (<tr key={inv.id}><td style={{ paddingLeft: '14px' }} className="mono">{inv.invoice_ref}</td><td>{fmtDate(inv.issued_date)}</td><td style={{ color: inv.status === 'overdue' ? 'var(--red)' : undefined }}>{fmtDate(inv.due_date)}</td><td style={{ fontWeight: 700 }}>£{fmt(inv.amount)}</td><td><span className={`badge badge-${sBadge(inv.status)}`}>{inv.status}</span></td></tr>))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 4 && (
          <div className="card"><div className="card-title">Activity log</div>
            <div className="afeed">
              {activityLog.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No activity recorded yet</div>}
              {activityLog.map((a, i) => (<div className="aitem" key={a.id}><div className="aleft"><div className="adot" style={{ background: 'var(--brand)' }}></div>{i < activityLog.length - 1 && <div className="aline"></div>}</div><div><div className="atext">{a.action}{a.field_changed ? <> — <strong>{a.field_changed}</strong></> : ''}{a.new_value ? <> → <strong>{a.new_value}</strong></> : ''}</div><div className="atime">{fmtDate(a.performed_at)} · by {a.performed_by_name || 'System'}</div></div></div>))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
