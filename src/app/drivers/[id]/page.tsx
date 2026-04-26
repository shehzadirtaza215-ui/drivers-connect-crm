'use client';

import Link from 'next/link';
import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Chart, registerables } from 'chart.js';
import { fetchDriver, deleteDriver, updateDriver, fetchDocuments, uploadDocument, fetchActivity, fetchOrderDrivers, fetchPayments } from '@/lib/data';
import { fmt, fmtDate, isExp } from '@/lib/helpers';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import FormField from '@/components/ui/FormField';

Chart.register(...registerables);

export default function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [driver, setDriver] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [driverShifts, setDriverShifts] = useState<any[]>([]);
  const [driverPayments, setDriverPayments] = useState<any[]>([]);
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);
  const tabs = ['Personal info', 'Documents', 'All orders & runs', 'All payments', 'Activity log'];

  useEffect(() => {
    const dId = Number(id);
    fetchDriver(dId).then(setDriver);
    fetchDocuments('driver', dId).then(setDocuments);
    fetchActivity('driver', dId).then(setActivityLog);
    // Fetch driver's order assignments via the order_drivers junction table
    fetchOrderDrivers({ driver_id: dId }).then(ods => {
      setDriverShifts(ods.map((od: any) => ({
        id: od.id, ref: od.orders?.order_ref || '', company: od.orders?.companies?.name || '', coId: od.orders?.company_id,
        date: od.orders?.start_datetime ? fmtDate(od.orders.start_datetime) : '-',
        route: od.orders?.start_address ? `${od.orders.start_address}${od.orders.end_address ? ' → ' + od.orders.end_address : ''}` : '-',
        hours: od.hours_done || od.orders?.hours_done || 0,
        driverRate: od.driver_rate || 14, coRate: od.orders?.company_rate || 0,
        status: od.orders?.status || od.status || 'assigned',
      })));
    });
    fetchPayments().then(pays => setDriverPayments(pays.filter((p: any) => p.driver_id === dId)));
  }, [id]);

  // Computed from real order_drivers data
  const totalShifts = driverShifts.length;
  const totalHours = driverShifts.reduce((s: number, o: any) => s + (o.hours || 0), 0);
  const totalEarned = driverPayments.filter((p: any) => p.direction === 'out').reduce((s: number, p: any) => s + (p.amount || 0), 0);

  useEffect(() => {
    if (activeTab === 2 && chartRef.current && !chartInst.current && driverShifts.length > 0) {
      const labels = driverShifts.map((o: any) => o.date).reverse();
      const data = driverShifts.map((o: any) => (o.hours || 0) * (o.driverRate || 0)).reverse();
      chartInst.current = new Chart(chartRef.current, {
        type: 'bar', data: { labels, datasets: [{ label: 'Pay', data, backgroundColor: '#2d7a3a', borderRadius: 4, borderSkipped: false }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 9 } }, border: { display: false } }, y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: 'rgba(0,0,0,.38)', font: { size: 10 }, callback: (v: string | number) => '£' + v }, border: { display: false } } } } as never
      });
    }
    return () => { if (activeTab !== 2) { chartInst.current?.destroy(); chartInst.current = null; } };
  }, [activeTab, driverShifts.length]);

  if (!driver) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}><div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style><div style={{ color: 'var(--text2)', fontWeight: 500 }}>Loading driver...</div></div>;

  function showEditDriver() {
    openModal(`Edit driver — ${driver.first_name} ${driver.last_name}`,
      <div>
        <div style={{ background: 'linear-gradient(135deg,#E8460A 0%,#c93a08 100%)', borderRadius: '10px', padding: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          {driver.avatar_url ? <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundImage: `url(${driver.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }} /> : <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }}>{driver.initials}</div>}
          <div><div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Edit driver profile</div><div style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>{driver.first_name} {driver.last_name}</div><div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>{driver.licence_category} · {driver.employment_type}</div></div>
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>👤 Personal information</div>
        <form id="edit-driver-form" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const fn = (fd.get('first_name') as string || '').trim();
          const ln = (fd.get('last_name') as string || '').trim();
          const updates: any = {
            first_name: fn, last_name: ln, initials: ((fn[0] || '') + (ln[0] || '')).toUpperCase(), phone: fd.get('phone'), email: fd.get('email'), address: fd.get('address'),
            emergency_contact: fd.get('emergency_contact'), emergency_phone: fd.get('emergency_phone'),
            licence_category: fd.get('licence_category'), employment_type: fd.get('employment_type'),
            licence_number: fd.get('licence_number'), cpc_number: fd.get('cpc_number'), cpc_expiry: fd.get('cpc_expiry') || null, tacho_card: fd.get('tacho_card'),
            rtw_type: fd.get('rtw_type'), rtw_expiry: fd.get('rtw_expiry') || null, share_code: fd.get('share_code'),
            utr_number: fd.get('utr_number'), ni_number: fd.get('ni_number'), tax_code: fd.get('tax_code'), status: fd.get('status')
          };
          const updated = await updateDriver(driver.id, updates);
          if (updated) { setDriver({ ...driver, ...updated }); toast('Driver updated ✓'); closeModal(); }
          else toast('Error updating driver', 'err');
        }}>
          <div className="form-grid"><FormField label="First name" id="df-fn" name="first_name" value={driver.first_name} required /><FormField label="Last name" id="df-ln" name="last_name" value={driver.last_name} required /><FormField label="Phone" id="df-ph" name="phone" type="tel" value={driver.phone} /><FormField label="Email" id="df-em" name="email" type="email" value={driver.email} /></div>
          <FormField label="Home address" id="df-addr" name="address" value={driver.address} />
          <div className="form-grid"><FormField label="Emergency contact" id="df-ec" name="emergency_contact" value={driver.emergency_contact} /><FormField label="Emergency phone" id="df-ep" name="emergency_phone" type="tel" value={driver.emergency_phone} /></div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>🚛 Licence &amp; compliance</div>
          <div className="form-grid">
            <FormField label="Licence category" id="df-lc" name="licence_category" value={driver.licence_category} options={['Class 1', 'Class 2', '7.5T', 'Van', 'Car']} required />
            <FormField label="Employment type" id="df-et" name="employment_type" value={driver.employment_type?.toLowerCase().replace(' ', '-')} options={[{ v: 'self-employed', l: 'Self-employed' }, { v: 'paye', l: 'PAYE' }]} required />
            <FormField label="Licence number" id="df-lno" name="licence_number" value={driver.licence_number} />
            <FormField label="CPC number" id="df-cpn" name="cpc_number" value={driver.cpc_number} />
            <FormField label="CPC expiry date" id="df-cpx" name="cpc_expiry" type="date" value={driver.cpc_expiry?.slice(0, 10)} />
            <FormField label="Tacho card no." id="df-tac" name="tacho_card" value={driver.tacho_card} />
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>🪪 Right to work</div>
          <div className="form-grid">
            <FormField label="RTW type" id="df-rtw" name="rtw_type" value={driver.rtw_type} options={[{ v: 'passport', l: 'UK/EU Passport' }, { v: 'visa', l: 'Visa' }, { v: 'share_code', l: 'Share code' }]} />
            <FormField label="RTW expiry (if visa)" id="df-rtwx" name="rtw_expiry" type="date" value={driver.rtw_expiry?.slice(0, 10)} />
            <FormField label="Share code (if applicable)" id="df-sc" name="share_code" value={driver.share_code} />
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>💷 Payroll &amp; tax</div>
          <div className="form-grid">
            <FormField label="UTR number" id="df-utr" name="utr_number" value={driver.utr_number} />
            <FormField label="NI number" id="df-ni" name="ni_number" value={driver.ni_number} />
            <FormField label="Tax code" id="df-tax" name="tax_code" value={driver.tax_code} />
            <FormField label="Status" id="df-status" name="status" value={driver.status} options={[{ v: 'available', l: 'Available' }, { v: 'active', l: 'Active' }, { v: 'suspended', l: 'Suspended' }]} />
          </div>
        </form>
      </div>,
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        <button className="btn btn-sm" style={{ color: 'var(--red)', background: 'rgba(232, 70, 10, 0.08)' }} onClick={async () => { await deleteDriver(driver.id); toast('Driver deleted ✓'); closeModal(); router.push('/drivers'); }}>Delete driver</button>
        <div style={{ display: 'flex', gap: '8px' }}><button className="btn btn-sm" onClick={closeModal}>Cancel</button><button type="submit" form="edit-driver-form" className="btn btn-primary btn-sm" style={{ minWidth: '120px' }}>Save changes</button></div>
      </div>
    );
  }

  function showUploadDocument() {
    openModal('Upload new document',
      <form id="upload-doc-form" onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const file = fd.get('file') as File; if (!file?.name) return toast('Select a file', 'err'); const result = await uploadDocument('driver', driver.id, fd.get('doc_type') as string, file); if (result) { setDocuments(await fetchDocuments('driver', driver.id)); toast('Document uploaded ✓'); closeModal(); } else toast('Upload failed', 'err'); }}>
        <FormField label="Document type" id="doc-type" name="doc_type" options={['Driving licence', 'CPC card', 'Tacho card', 'Passport / Visa', 'Contract', 'Other']} required />
        <div style={{ marginBottom: '16px', marginTop: '16px' }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text2)' }}>Select file</label><input type="file" name="file" style={{ fontSize: '13px', width: '100%' }} required /></div>
      </form>,
      <><button className="btn btn-sm" onClick={closeModal}>Cancel</button><button type="submit" form="upload-doc-form" className="btn btn-primary btn-sm">Upload</button></>
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
          {driver.avatar_url ? <div className="av av-xl" style={{ backgroundImage: `url(${driver.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center', border: 'none' }} /> : <div className="av av-xl" style={{ background: driver.avatar_color, color: driver.avatar_text_color }}>{driver.initials}</div>}
          <div className="phero-info">
            <div className="phero-name">{driver.first_name} {driver.last_name}</div>
            <div className="phero-meta">{driver.phone} · {driver.email || 'No email'} · {driver.address || 'No address'}</div>
            <div className="phero-badges">
              <span className="badge badge-blue">{driver.licence_category || 'No licence'}</span>
              <span className="badge badge-gray">{driver.employment_type || '—'}</span>
              {driver.rtw_type && <span className={`badge badge-${driver.rtw_type === 'passport' ? 'green' : 'amber'}`}>{driver.rtw_type === 'passport' ? 'UK Passport — RTW ✓' : 'Visa'}</span>}
              {driver.cpc_expiry && isExp(driver.cpc_expiry) && <span className="badge badge-red">CPC Expired</span>}
            </div>
            <div className="phero-stats">
              <div className="ps"><div className="ps-label">Total shifts</div><div className="ps-val">{driver.total_shifts || totalShifts}</div></div>
              <div className="ps"><div className="ps-label">Total hours</div><div className="ps-val">{fmt(driver.total_hours || totalHours)}h</div></div>
              <div className="ps"><div className="ps-label">Total earned</div><div className="ps-val" style={{ color: 'var(--green-mid)' }}>£{fmt(driver.total_earned || totalEarned)}</div></div>
              <div className="ps"><div className="ps-label">Since</div><div className="ps-val" style={{ fontSize: '14px' }}>{fmtDate(driver.created_at)}</div></div>
            </div>
          </div>
        </div>
        <div className="tabs">{tabs.map((t, i) => (<div key={t} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>))}</div>

        {activeTab === 0 && (
          <div className="g2">
            <div className="card"><div className="card-title">Personal details</div>
              {[['Full name', `${driver.first_name} ${driver.last_name}`], ['Phone', driver.phone], ['Email', driver.email], ['Address', driver.address], ['Emergency contact', driver.emergency_contact], ['Emergency phone', driver.emergency_phone], ['Joined', fmtDate(driver.created_at)]].map(([l, v]) => (<div className="lr" key={l as string}><span style={{ flex: 1, fontSize: '11.5px', color: 'var(--text3)' }}>{l}</span><span style={{ fontWeight: 500 }}>{v || '—'}</span></div>))}
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary btn-sm" onClick={showEditDriver}>Edit driver</button></div>
            </div>
            <div className="card"><div className="card-title">Compliance &amp; licence</div>
              {[['Licence category', driver.licence_category], ['Licence number', driver.licence_number], ['CPC number', driver.cpc_number], ['CPC expiry', driver.cpc_expiry ? (isExp(driver.cpc_expiry) ? `${fmtDate(driver.cpc_expiry)} — EXPIRED` : fmtDate(driver.cpc_expiry)) : '—'], ['Tacho card', driver.tacho_card], ['Right to work', driver.rtw_type], ['UTR number', driver.utr_number], ['NI number', driver.ni_number], ['Tax code', driver.tax_code], ['Share code', driver.share_code], ['Employment type', driver.employment_type]].map(([l, v]) => (<div className="lr" key={l as string}><span style={{ flex: 1, fontSize: '11.5px', color: 'var(--text3)' }}>{l}</span><span style={{ fontWeight: 500, color: String(v).includes('EXPIRED') ? 'var(--red)' : undefined }}>{v || '—'}</span></div>))}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="doc-grid">
            {documents.map((doc: any) => (<div className="dc" key={doc.id} style={{ cursor: 'pointer' }}><div className="dc-icon"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="1" width="12" height="16" rx="1.5"/><line x1="6" y1="6" x2="12" y2="6"/></svg></div><div className="dc-name">{doc.doc_type}</div><div className="dc-sub">{doc.file_name}</div><span className="badge badge-green" style={{ marginTop: '6px' }}>Uploaded</span></div>))}
            {documents.length === 0 && <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No documents uploaded yet</div>}
            <div className="dc empty-card" style={{ minHeight: '90px', cursor: 'pointer' }} onClick={showUploadDocument}><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/></svg><div className="dc-sub">Upload document</div></div>
          </div>
        )}

        {activeTab === 2 && (
          <>
            <div className="g4" style={{ marginBottom: '16px' }}>
              <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Total runs</div><div className="mcard-val">{totalShifts}</div></div>
              <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Total hours</div><div className="mcard-val">{fmt(totalHours)}h</div></div>
              <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Driver pay</div><div className="mcard-val vg">£{fmt(driverShifts.reduce((s: number, o: any) => s + (o.hours * o.driverRate), 0))}</div></div>
              <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Orders</div><div className="mcard-val">{driverShifts.length}</div></div>
            </div>
            {driverShifts.length > 0 && <div className="card" style={{ marginBottom: '14px' }}><div className="card-title">Earnings — per order</div><div style={{ position: 'relative', height: '160px' }}><canvas ref={chartRef}></canvas></div></div>}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="dt">
                <thead><tr><th style={{ paddingLeft: '14px' }}>Order</th><th>Company</th><th>Date</th><th>Route</th><th>Hours</th><th>Pay</th><th>Billed</th><th>Margin</th><th>Status</th></tr></thead>
                <tbody>
                  {driverShifts.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No orders assigned yet</td></tr>}
                  {driverShifts.map((o: any) => {
                    const pay = o.hours * o.driverRate;
                    const billed = o.hours * o.coRate;
                    return (
                      <tr key={o.id}>
                        <td style={{ paddingLeft: '14px' }}><span className="mono lnk">{o.ref}</span></td>
                        <td><Link href={`/companies/${o.coId}`} className="lnk">{o.company}</Link></td>
                        <td>{o.date}</td><td>{o.route}</td><td>{o.hours > 0 ? `${o.hours}h` : '-'}</td>
                        <td>{pay > 0 ? `£${fmt(pay)}` : '-'}</td><td>{billed > 0 ? `£${fmt(billed)}` : '-'}</td>
                        <td style={{ color: 'var(--green-mid)', fontWeight: 600 }}>{billed - pay > 0 ? `£${fmt(billed - pay)}` : '-'}</td>
                        <td><span className={`badge badge-${o.status === 'completed' ? 'green' : o.status === 'active' ? 'blue' : 'amber'}`}>{o.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 3 && (
          <>
            <div className="fin-hero">
              <div className="fh fg"><div className="fh-label">Total paid out</div><div className="fh-val" style={{ color: 'var(--green-mid)' }}>£{fmt(totalEarned)}</div></div>
              <div className="fh"><div className="fh-label">Total runs</div><div className="fh-val">{totalShifts}</div></div>
              <div className="fh"><div className="fh-label">Total hours</div><div className="fh-val">{fmt(totalHours)}h</div></div>
            </div>
            <div className="card"><div className="card-title">Payment history</div>
              {driverPayments.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No payments recorded yet</div>}
              {driverPayments.map((p: any) => (<div className="prow" key={p.id} style={{ borderBottom: '.5px solid var(--border)' }}><span className={`pd pd-${p.direction}`}>{p.direction === 'out' ? 'OUT' : 'IN'}</span><div className="lr-info"><div className="lr-name">{fmtDate(p.pay_date)} · {p.method || 'bank_transfer'}</div><div className="lr-meta mono">{p.payment_ref}</div></div><div className="lr-amt" style={{ color: p.status === 'paid' ? 'var(--green-mid)' : 'var(--amber)' }}>£{fmt(p.amount)}</div><span className={`badge badge-${p.status === 'paid' ? 'green' : 'amber'}`} style={{ marginLeft: '8px' }}>{p.status}</span></div>))}
            </div>
          </>
        )}

        {activeTab === 4 && (
          <div className="card"><div className="card-title">Activity log</div>
            <div className="afeed">
              {activityLog.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No activity recorded yet</div>}
              {activityLog.map((a, i) => (<div className="aitem" key={a.id}><div className="aleft"><div className="adot" style={{ background: a.action?.includes('created') ? 'var(--green-mid)' : 'var(--brand)' }}></div>{i < activityLog.length - 1 && <div className="aline"></div>}</div><div><div className="atext">{a.action}{a.field_changed ? <> — <strong>{a.field_changed}</strong></> : ''}{a.old_value ? <> from <em>{a.old_value}</em></> : ''}{a.new_value ? <> → <strong>{a.new_value}</strong></> : ''}</div><div className="atime">{fmtDate(a.performed_at)} · by {a.performed_by_name || 'System'}</div></div></div>))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
