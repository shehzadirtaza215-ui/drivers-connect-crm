'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DEMO_DRIVERS, DEMO_COMPANIES, DEMO_PAYMENTS } from '@/lib/demo-data';
import { fmt, fmtDate, sBadge } from '@/lib/helpers';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import FormField from '@/components/ui/FormField';

export default function PaymentsPage() {
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);

  useEffect(() => {
    setPayments(DEMO_PAYMENTS.filter(p => {
      if (p.driver_id) return DEMO_DRIVERS.some(d => d.id === p.driver_id);
      if (p.company_id) return DEMO_COMPANIES.some(c => c.id === p.company_id);
      return true;
    }));
    setPendingDrivers(DEMO_DRIVERS.filter(d => (d.pending_pay || 0) > 0));
  }, []);

  const totalDue = pendingDrivers.reduce((s, d) => s + (d.pending_pay || 0), 0);

  function handleLogPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newId = DEMO_PAYMENTS.length > 0 ? Math.max(...DEMO_PAYMENTS.map(p => p.id)) + 1 : 1;
    const isOut = fd.get('direction') === 'out';
    const driverId = Number(fd.get('driver_id'));
    const companyId = Number(fd.get('company_id'));
    
    if (isOut && !driverId) return toast('Select a driver', 'err');
    if (!isOut && !companyId) return toast('Select a company', 'err');

    const newPayment: any = {
      id: newId,
      payment_ref: `PAY-${String(newId + 210).padStart(3, '0')}`,
      direction: isOut ? 'out' : 'in',
      amount: Number(fd.get('amount')) || 0,
      pay_date: fd.get('date') as string,
      method: fd.get('method') as string,
      status: 'paid',
    };

    if (isOut) {
      newPayment.driver_id = driverId;
      newPayment.driver_name = DEMO_DRIVERS.find(d => d.id === driverId)?.first_name + ' ' + DEMO_DRIVERS.find(d => d.id === driverId)?.last_name;
    } else {
      newPayment.company_id = companyId;
      newPayment.company_name = DEMO_COMPANIES.find(c => c.id === companyId)?.name;
    }

    DEMO_PAYMENTS.unshift(newPayment);
    setPayments([...DEMO_PAYMENTS].filter(p => {
      if (p.driver_id) return DEMO_DRIVERS.some(d => d.id === p.driver_id);
      if (p.company_id) return DEMO_COMPANIES.some(c => c.id === p.company_id);
      return true;
    }));
    toast('Payment logged ✓');
    closeModal();
  }

  function showLogPayment() {
    openModal('Log payment',
      <form id="log-payment-form" onSubmit={handleLogPayment}>
        <FormField label="Direction" id="pm-dir" name="direction" options={[{ v: 'out', l: 'OUT — Pay a driver' }, { v: 'in', l: 'IN — Received from company' }]} required />
        <FormField label="Driver" id="pm-driver" name="driver_id" options={[{ v: '', l: '— Select driver —' }, ...DEMO_DRIVERS.map(d => ({ v: String(d.id), l: `${d.first_name} ${d.last_name} (${d.licence_category})` }))]} />
        <FormField label="Company" id="pm-company" name="company_id" options={[{ v: '', l: '— Select company —' }, ...DEMO_COMPANIES.map(c => ({ v: String(c.id), l: c.name }))]} />
        <div className="form-grid">
          <FormField label="Amount (£)" id="pm-amt" name="amount" type="number" required />
          <FormField label="Date" id="pm-date" name="date" type="date" value={new Date().toISOString().split('T')[0]} required />
          <FormField label="Week ending (driver pay)" id="pm-wk" name="week_ending" type="date" />
          <FormField label="Total hours" id="pm-hrs" name="total_hours" type="number" />
        </div>
        <FormField label="Method" id="pm-method" name="method" options={[{ v: 'bank_transfer', l: 'Bank transfer' }, { v: 'bacs', l: 'BACS' }, { v: 'cheque', l: 'Cheque' }, { v: 'cash', l: 'Cash' }]} />
        <FormField label="Notes" id="pm-notes" />
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px' }}>Payment proof (optional)</div>
          <label className="dc" style={{ textAlign: 'center', padding: '16px', cursor: 'pointer', display: 'block' }}>
            <input type="file" style={{ display: 'none' }} onChange={(e) => e.target.files?.length && toast('Receipt selected: ' + e.target.files[0].name)} />
            <div className="dc-icon" style={{ margin: '0 auto 6px' }}>📎</div>
            <div className="dc-sub">Upload bank receipt / transfer confirmation</div>
          </label>
        </div>
      </form>,
      <><button className="btn btn-sm" onClick={closeModal}>Cancel</button><button type="submit" form="log-payment-form" className="btn btn-primary btn-sm">Log payment</button></>
    );
  }

  function markPaid(driverId: number, name: string) {
    toast(`${name} — marked as paid ✓`);
    setExpanded(null);
  }

  return (
    <>
      <div className="topbar"><div className="page-title">Payments</div><div className="tbar-right"><button className="btn btn-primary btn-sm" onClick={showLogPayment}>+ Log payment</button></div></div>
      <div className="content">
        <div className="g4" style={{ marginBottom: '16px' }}>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Received (Apr)</div><div className="mcard-val vg">£2,160</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Paid to drivers (Apr)</div><div className="mcard-val va">£1,820</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Payroll due 25 Apr</div><div className="mcard-val vr">£{fmt(totalDue)}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Net margin (Apr)</div><div className="mcard-val vg">£340</div></div>
        </div>

        <div className="card" style={{ marginBottom: '14px' }}>
          <div className="ch"><span className="card-title">Driver payroll — pending · due 25 Apr</span></div>
          {pendingDrivers.map(d => (
            <div className="pay-expandable" key={d.id}>
              <div className="prow clickable" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                <span className="pd pd-out">OUT</span>
                <div className="lr-info">
                  <div className="lr-name"><Link href={`/drivers/${d.id}`} className="lnk" onClick={e => e.stopPropagation()}>{d.first_name} {d.last_name}</Link></div>
                  <div className="lr-meta">{d.total_hours ? Math.round(d.total_hours / 8) + 'h' : ''} · {d.employment_type}</div>
                </div>
                <div className="lr-amt va">£{fmt(d.pending_pay)}</div>
                <span className="badge badge-amber" style={{ marginLeft: '8px' }}>Due</span>
                <span style={{ marginLeft: '8px', color: 'var(--text3)', fontSize: '12px' }}>{expanded === d.id ? '▲' : '▼'}</span>
              </div>
              {expanded === d.id && (
                <div className="pay-expand-body">
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Upload payment proof and mark as paid once transferred.</div>
                  <label className="dc" style={{ textAlign: 'center', padding: '14px', cursor: 'pointer', marginTop: '6px', display: 'block' }}>
                    <input type="file" style={{ display: 'none' }} onChange={(e) => e.target.files?.length && toast('Receipt selected: ' + e.target.files[0].name)} />
                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>📎 Upload bank receipt / proof of payment</div>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button className="btn btn-sm" onClick={() => setExpanded(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => markPaid(d.id, d.first_name + ' ' + d.last_name)}>Mark paid &amp; save proof</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <hr className="sep-line" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px' }}><span>Total due</span><span style={{ color: 'var(--red)' }}>£{fmt(totalDue)}</span></div>
        </div>

        <div className="card">
          <div className="ch"><span className="card-title">All transactions</span></div>
          {payments.map(p => (
            <div className="prow" key={p.id} style={{ borderBottom: '.5px solid var(--border)' }}>
              <span className={`pd ${p.direction === 'in' ? 'pd-in' : 'pd-out'}`}>{p.direction === 'in' ? 'IN' : 'OUT'}</span>
              <div className="lr-info">
                <div className="lr-name">{p.direction === 'in' ? p.company_name : p.driver_name}</div>
                <div className="lr-meta">{fmtDate(p.pay_date)} · {p.method?.replace('_', ' ')} · {p.payment_ref}</div>
              </div>
              <div className="lr-amt" style={{ color: p.direction === 'in' ? 'var(--green-mid)' : 'var(--red)' }}>{p.direction === 'in' ? '+' : '-'}£{fmt(p.amount)}</div>
              <span className={`badge badge-${sBadge(p.status)}`} style={{ marginLeft: '8px' }}>{p.status}</span>
              <span className="proof-dot pg-dot">✓</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
