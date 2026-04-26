'use client';

import Link from 'next/link';
import { use, useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { DEMO_DRIVERS, DEMO_ACTIVITY } from '@/lib/demo-data';
import { fmt, fmtDate, isExp } from '@/lib/helpers';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import FormField from '@/components/ui/FormField';

Chart.register(...registerables);

export default function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const driver = DEMO_DRIVERS.find(d => d.id === Number(id)) || DEMO_DRIVERS[0];
  const [activeTab, setActiveTab] = useState(0);
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);
  const tabs = ['Personal info', 'Documents', 'All orders & runs', 'All payments', 'Activity log'];

  useEffect(() => {
    if (activeTab === 2 && chartRef.current && !chartInst.current) {
      chartInst.current = new Chart(chartRef.current, {
        type: 'bar', data: { labels: ['Feb', 'wk1M', 'wk2M', 'wk3M', 'wk4M', 'wk1A', 'wk2A', 'wk3A'], datasets: [
          { label: 'Paid', data: [510, 480, 540, 600, 570, 630, 540, 0], backgroundColor: '#2d7a3a', borderRadius: 4, borderSkipped: false },
          { label: 'Pending', data: [0, 0, 0, 0, 0, 0, 0, 630], backgroundColor: '#E8460A', borderRadius: 4, borderSkipped: false }
        ] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { stacked: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 9 } }, border: { display: false } }, y: { stacked: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 10 }, callback: (v: string | number) => '£' + v }, border: { display: false } } } } as never
      });
    }
    return () => { if (activeTab !== 2) { chartInst.current?.destroy(); chartInst.current = null; } };
  }, [activeTab]);

  const driverOrders = [
    { ref: 'ORD-041', company: 'DHL Logistics', coId: 1, date: '17 Apr 2026', route: 'Glasgow → Leeds', hours: '9.5h', pay: '£142.50', billed: '£190.00', margin: '£47.50', status: 'Completed' },
    { ref: 'ORD-038', company: 'DHL Logistics', coId: 1, date: '14 Apr 2026', route: 'Glasgow → Manchester', hours: '11h', pay: '£165.00', billed: '£220.00', margin: '£55.00', status: 'Completed' },
    { ref: 'ORD-035', company: 'Amazon FC', coId: 2, date: '10 Apr 2026', route: 'Dunfermline DC', hours: '8h', pay: '£120.00', billed: '£160.00', margin: '£40.00', status: 'Completed' },
    { ref: 'ORD-031', company: 'DHL Logistics', coId: 1, date: '4 Apr 2026', route: 'Glasgow → Leeds', hours: '9h', pay: '£135.00', billed: '£180.00', margin: '£45.00', status: 'Completed' },
    { ref: 'ORD-028', company: 'Royal Mail', coId: 4, date: '28 Mar 2026', route: 'Glasgow Hub', hours: '—', pay: '—', billed: '—', margin: '—', status: 'Cancelled' },
  ];

  function showEditDriver() {
    openModal(`Edit driver — ${driver.first_name} ${driver.last_name}`,
      <div>
        <div style={{ background: 'linear-gradient(135deg,#E8460A 0%,#c93a08 100%)', borderRadius: '10px', padding: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          {driver.avatar_url ? (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundImage: `url(${driver.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }}>{driver.initials}</div>
          )}
          <div><div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Edit driver profile</div><div style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>{driver.first_name} {driver.last_name}</div><div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>{driver.licence_category} · {driver.employment_type}</div></div>
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>👤 Personal information</div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text2)' }}>Profile picture</label>
          <input type="file" id="df-pic" accept="image/*" style={{ fontSize: '13px', width: '100%' }} />
        </div>
        <div className="form-grid">
          <FormField label="First name" id="df-fn" value={driver.first_name} required />
          <FormField label="Last name" id="df-ln" value={driver.last_name} required />
          <FormField label="Phone" id="df-ph" type="tel" value={driver.phone} />
          <FormField label="Email" id="df-em" type="email" value={driver.email} />
        </div>
        <FormField label="Home address" id="df-addr" value={driver.address} />
        <div className="form-grid"><FormField label="Emergency contact" id="df-ec" value={driver.emergency_contact} /><FormField label="Emergency phone" id="df-ep" type="tel" value={driver.emergency_phone} /></div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>🚛 Licence &amp; compliance</div>
        <div className="form-grid">
          <FormField label="Licence category" id="df-lc" value={driver.licence_category} options={['Class 1', 'Class 2', '7.5T', 'Van', 'Car']} required />
          <FormField label="Employment type" id="df-et" value={driver.employment_type?.toLowerCase().replace(' ', '-')} options={[{ v: 'self-employed', l: 'Self-employed' }, { v: 'paye', l: 'PAYE' }]} required />
          <FormField label="CPC expiry date" id="df-cpx" type="date" value={driver.cpc_expiry?.slice(0, 10)} />
          <FormField label="Status" id="df-status" value={driver.status} options={[{ v: 'available', l: 'Available' }, { v: 'active', l: 'Active' }, { v: 'suspended', l: 'Suspended' }]} />
        </div>
      </div>,
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        <button className="btn btn-sm" style={{ color: 'var(--red)', background: 'rgba(232, 70, 10, 0.08)' }} onClick={() => {
          const idx = DEMO_DRIVERS.findIndex(d => d.id === driver.id);
          if (idx !== -1) DEMO_DRIVERS.splice(idx, 1);
          toast('Driver deleted');
          closeModal();
          window.location.href = '/drivers';
        }}>Delete driver</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary btn-sm" style={{ minWidth: '120px' }} onClick={() => { toast('Driver updated ✓'); closeModal(); }}>Save changes</button>
        </div>
      </div>
    );
  }

  function showUploadDocument() {
    openModal(
      'Upload new document',
      <div>
        <FormField label="Document type" id="doc-type" options={['Driving licence', 'CPC card', 'Tacho card', 'Passport / Visa', 'Contract', 'Other']} required />
        <div style={{ marginBottom: '16px', marginTop: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text2)' }}>Select file</label>
          <input type="file" style={{ fontSize: '13px', width: '100%' }} required />
        </div>
      </div>,
      <>
        <button className="btn btn-sm" onClick={closeModal}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={() => { toast('Document uploaded ✓'); closeModal(); }}>Upload</button>
      </>
    );
  }

  function showDocument(docName: string) {
    openModal(
      `View Document — ${docName}`,
      <div style={{ padding: '30px', background: 'var(--bg-mid)', borderRadius: '8px', textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" style={{ opacity: 0.8, marginBottom: '16px' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text1)' }}>{docName}</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px', maxWidth: '250px', lineHeight: '1.4' }}>In a live environment, the actual PDF or image file renders here securely from Supabase Storage.</div>
      </div>,
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-sm" style={{ color: 'var(--red)', background: 'rgba(232, 70, 10, 0.08)' }} onClick={() => { toast('Document deleted'); closeModal(); }}>Delete</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" onClick={closeModal}>Close</button>
          <button className="btn btn-primary btn-sm" onClick={() => { toast('Download started'); closeModal(); }}>Download</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="breadcrumb"><Link href="/drivers" className="bc-link">Drivers</Link><span className="bc-sep">›</span><span>{driver.first_name} {driver.last_name}</span></div>
        <div className="tbar-right"><button className="btn btn-sm" onClick={showEditDriver}>Edit</button><button className="btn btn-primary btn-sm">+ Assign to order</button></div>
      </div>
      <div className="content">
        <div className="phero">
          {driver.avatar_url ? (
            <div className="av av-xl" style={{ backgroundImage: `url(${driver.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center', border: 'none' }} />
          ) : (
            <div className="av av-xl" style={{ background: driver.avatar_color, color: driver.avatar_text_color }}>{driver.initials}</div>
          )}
          <div className="phero-info">
            <div className="phero-name">{driver.first_name} {driver.last_name}</div>
            <div className="phero-meta">{driver.phone} · {driver.email || 'No email'} · {driver.address || 'No address'}</div>
            <div className="phero-badges">
              <span className="badge badge-blue">{driver.licence_category}</span>
              <span className="badge badge-gray">{driver.employment_type}</span>
              <span className={`badge badge-${driver.rtw_type === 'passport' ? 'green' : 'amber'}`}>{driver.rtw_type === 'passport' ? 'UK Passport — RTW ✓' : 'Visa'}</span>
              {driver.cpc_expiry && isExp(driver.cpc_expiry) && <span className="badge badge-red">CPC Expired</span>}
            </div>
            <div className="phero-stats">
              <div className="ps"><div className="ps-label">Total shifts</div><div className="ps-val">{driver.total_shifts || 0}</div></div>
              <div className="ps"><div className="ps-label">Total hours</div><div className="ps-val">{fmt(driver.total_hours)}h</div></div>
              <div className="ps"><div className="ps-label">Total earned</div><div className="ps-val" style={{ color: 'var(--green-mid)' }}>£{fmt(driver.total_earned)}</div></div>
              <div className="ps"><div className="ps-label">Pending pay</div><div className="ps-val" style={{ color: 'var(--amber)' }}>£{fmt(driver.pending_pay)}</div></div>
              <div className="ps"><div className="ps-label">Since</div><div className="ps-val" style={{ fontSize: '14px' }}>{fmtDate(driver.created_at)}</div></div>
            </div>
          </div>
        </div>
        <div className="tabs">{tabs.map((t, i) => (<div key={t} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>))}</div>

        {activeTab === 0 && (
          <div className="g2">
            <div className="card"><div className="card-title">Personal details</div>
              {[['Full name', `${driver.first_name} ${driver.last_name}`], ['Phone', driver.phone], ['Email', driver.email], ['Address', driver.address], ['Emergency contact', driver.emergency_contact], ['Emergency phone', driver.emergency_phone], ['Joined', fmtDate(driver.created_at)]].map(([l, v]) => (
                <div className="lr" key={l as string}><span style={{ flex: 1, fontSize: '11.5px', color: 'var(--text3)' }}>{l}</span><span style={{ fontWeight: 500 }}>{v || '—'}</span></div>
              ))}
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary btn-sm" onClick={showEditDriver}>Edit driver</button></div>
            </div>
            <div className="card"><div className="card-title">Compliance &amp; licence</div>
              {[['Licence category', driver.licence_category], ['Licence number', driver.licence_number], ['CPC number', driver.cpc_number], ['CPC expiry', driver.cpc_expiry ? (isExp(driver.cpc_expiry) ? `${fmtDate(driver.cpc_expiry)} — EXPIRED` : fmtDate(driver.cpc_expiry)) : '—'], ['Tacho card', driver.tacho_card], ['Right to work', driver.rtw_type], ['UTR number', driver.utr_number], ['Employment type', driver.employment_type]].map(([l, v]) => (
                <div className="lr" key={l as string}><span style={{ flex: 1, fontSize: '11.5px', color: 'var(--text3)' }}>{l}</span><span style={{ fontWeight: 500, color: String(v).includes('EXPIRED') ? 'var(--red)' : undefined }}>{v || '—'}</span></div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="doc-grid">
            {[{ name: 'Driving licence', valid: true }, { name: 'CPC card', valid: false }, { name: 'Tacho card', valid: true }, { name: 'Passport', valid: true }, { name: 'Contract', valid: true }].map((doc) => (
              <div className="dc" key={doc.name} onClick={() => showDocument(doc.name)} style={{ cursor: 'pointer' }}>
                <div className="dc-icon"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="1" width="12" height="16" rx="1.5"/><line x1="6" y1="6" x2="12" y2="6"/></svg></div>
                <div className="dc-name">{doc.name}</div>
                <div className="dc-sub">1 file</div>
                <span className={`badge ${doc.valid ? 'badge-green' : 'badge-red'}`} style={{ marginTop: '6px' }}>{doc.valid ? 'Valid' : 'Expired'}</span>
              </div>
            ))}
            <div className="dc empty-card" style={{ minHeight: '90px', cursor: 'pointer' }} onClick={showUploadDocument}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/></svg>
              <div className="dc-sub">Upload document</div>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <>
            <div className="g4" style={{ marginBottom: '16px' }}>
              <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Total runs</div><div className="mcard-val">{driver.total_shifts}</div></div>
              <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Total hours</div><div className="mcard-val">{fmt(driver.total_hours)}h</div></div>
              <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Driver pay</div><div className="mcard-val vg">£{fmt(driver.total_earned)}</div></div>
              <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Pending</div><div className="mcard-val va">£{fmt(driver.pending_pay)}</div></div>
            </div>
            <div className="card" style={{ marginBottom: '14px' }}><div className="card-title">Earnings — weekly breakdown</div><div style={{ position: 'relative', height: '160px' }}><canvas ref={chartRef}></canvas></div></div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="dt">
                <thead><tr><th style={{ paddingLeft: '14px' }}>Order</th><th>Company</th><th>Date</th><th>Route</th><th>Hours</th><th>Pay</th><th>Billed</th><th>Margin</th><th>Status</th></tr></thead>
                <tbody>
                  {driverOrders.map(o => (
                    <tr key={o.ref}>
                      <td style={{ paddingLeft: '14px' }}><span className={`mono ${o.status === 'Cancelled' ? '' : 'lnk'}`} style={o.status === 'Cancelled' ? { color: 'var(--red)' } : {}}>{o.ref}</span></td>
                      <td><Link href={`/companies/${o.coId}`} className="lnk">{o.company}</Link></td>
                      <td>{o.date}</td><td>{o.route}</td><td>{o.hours}</td><td>{o.pay}</td><td>{o.billed}</td>
                      <td style={{ color: o.margin !== '—' ? 'var(--green-mid)' : undefined, fontWeight: 600 }}>{o.margin}</td>
                      <td><span className={`badge badge-${o.status === 'Completed' ? 'green' : 'red'}`}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 3 && (
          <>
            <div className="fin-hero">
              <div className="fh fg"><div className="fh-label">Total paid out</div><div className="fh-val" style={{ color: 'var(--green-mid)' }}>£{fmt(driver.total_earned)}</div></div>
              <div className="fh fa"><div className="fh-label">Pending</div><div className="fh-val" style={{ color: 'var(--amber)' }}>£{fmt(driver.pending_pay)}</div></div>
              <div className="fh"><div className="fh-label">Total runs</div><div className="fh-val">{driver.total_shifts}</div></div>
            </div>
            <div className="card"><div className="card-title">Payment history</div>
              {[{ week: '18 Apr', hrs: '42h', runs: 2, amount: 630, status: 'Due', ref: 'PAY-PEND' }, { week: '11 Apr', hrs: '36h', runs: 3, amount: 540, status: 'Paid', ref: 'PAY-203' }, { week: '4 Apr', hrs: '42h', runs: 4, amount: 630, status: 'Paid', ref: 'PAY-198' }].map(p => (
                <div className="prow" key={p.ref} style={{ borderBottom: '.5px solid var(--border)' }}>
                  <span className="pd pd-out">OUT</span>
                  <div className="lr-info"><div className="lr-name">Week ending {p.week} · {p.hrs} · {p.runs} runs</div><div className="lr-meta mono">{p.ref}</div></div>
                  <div className="lr-amt" style={{ color: p.status === 'Paid' ? 'var(--green-mid)' : 'var(--amber)' }}>£{fmt(p.amount)}</div>
                  <span className={`badge badge-${p.status === 'Paid' ? 'green' : 'amber'}`} style={{ marginLeft: '8px' }}>{p.status}</span>
                  <span className={`proof-dot ${p.status === 'Paid' ? 'pg-dot' : 'pr-dot'}`}>{p.status === 'Paid' ? '✓' : '!'}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 4 && (
          <div className="card"><div className="card-title">Activity log</div>
            <div className="afeed">
              {DEMO_ACTIVITY.map((a, i) => (
                <div className="aitem" key={a.id}>
                  <div className="aleft"><div className="adot" style={{ background: a.action.includes('created') ? 'var(--green-mid)' : 'var(--brand)' }}></div>{i < DEMO_ACTIVITY.length - 1 && <div className="aline"></div>}</div>
                  <div><div className="atext">{a.action}{a.field_changed ? <> — <strong>{a.field_changed}</strong></> : ''}{a.old_value ? <> from <em>{a.old_value}</em></> : ''}{a.new_value ? <> → <strong>{a.new_value}</strong></> : ''}</div><div className="atime">{fmtDate(a.performed_at)} · by {a.performed_by_name || 'System'}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
