'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchDrivers, fetchCompanies, fetchPayments, createPayment, markDriverShiftsPaid } from '@/lib/data';
import { fmt, fmtDate, sBadge } from '@/lib/helpers';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import FormField from '@/components/ui/FormField';
import type { Driver, Company, Payment } from '@/lib/types';

export default function PaymentsPage() {
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPayments(), fetchDrivers(), fetchCompanies()]).then(([pay, drv, co]) => {
      setPayments(pay);
      setDrivers(drv);
      setCompanies(co);
      setPendingDrivers(drv.filter(d => (d.pending_pay || 0) > 0));
      setLoading(false);
    });
  }, []);

  const totalDue = pendingDrivers.reduce((s, d) => s + (d.pending_pay || 0), 0);
  const totalReceived = payments.filter(p => p.direction === 'in').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPaidOut = payments.filter(p => p.direction === 'out').reduce((s, p) => s + (p.amount || 0), 0);
  const netMargin = totalReceived - totalPaidOut;

  async function handleLogPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const isOut = fd.get('direction') === 'out';
    const driverId = Number(fd.get('driver_id'));
    const companyId = Number(fd.get('company_id'));
    
    if (isOut && !driverId) return toast('Select a driver', 'err');
    if (!isOut && !companyId) return toast('Select a company', 'err');

    const newPayment: Partial<Payment> = {
      direction: isOut ? 'out' : 'in',
      amount: Number(fd.get('amount')) || 0,
      pay_date: fd.get('date') as string,
      method: fd.get('method') as string,
      status: 'paid',
    };

    if (isOut) (newPayment as any).driver_id = driverId;
    else (newPayment as any).company_id = companyId;

    const created = await createPayment(newPayment);
    if (created) {
      // Re-fetch payments to get joined names
      const freshPayments = await fetchPayments();
      setPayments(freshPayments);
      toast('Payment logged ✓');
      closeModal();
    } else {
      toast('Error logging payment', 'err');
    }
  }

  function showLogPayment() {
    openModal('Log payment',
      <form id="log-payment-form" onSubmit={handleLogPayment}>
        <FormField label="Direction" id="pm-dir" name="direction" options={[{ v: 'out', l: 'OUT — Pay a driver' }, { v: 'in', l: 'IN — Received from company' }]} required />
        <FormField label="Driver" id="pm-driver" name="driver_id" options={[{ v: '', l: '— Select driver —' }, ...drivers.map(d => ({ v: String(d.id), l: `${d.first_name} ${d.last_name} (${d.licence_category})` }))]} />
        <FormField label="Company" id="pm-company" name="company_id" options={[{ v: '', l: '— Select company —' }, ...companies.map(c => ({ v: String(c.id), l: c.name }))]} />
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

  async function markPaid(driverId: number, name: string, amount: number) {
    const newPayment: Partial<Payment> = { direction: 'out', amount, driver_id: driverId, pay_date: new Date().toISOString().split('T')[0], method: 'bank_transfer', status: 'paid' };
    const created = await createPayment(newPayment);
    if (created) {
      await markDriverShiftsPaid(driverId);
      const [pay, drv] = await Promise.all([fetchPayments(), fetchDrivers()]);
      setPayments(pay); setDrivers(drv); setPendingDrivers(drv.filter(d => (d.pending_pay || 0) > 0));
      toast(`${name} — marked as paid ✓`);
      setExpanded(null);
    } else {
      toast('Error logging payment', 'err');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: 'var(--text2)', fontWeight: 500 }}>Loading payments...</div>
      </div>
    );
  }

  return (
    <>
      <div className="topbar"><div className="page-title">Payments</div><div className="tbar-right"><button className="btn btn-primary btn-sm" onClick={showLogPayment}>+ Log payment</button></div></div>
      <div className="content">
        <div className="g4" style={{ marginBottom: '16px' }}>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Received (total)</div><div className="mcard-val vg">£{fmt(totalReceived)}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Paid to drivers</div><div className="mcard-val va">£{fmt(totalPaidOut)}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Payroll due</div><div className="mcard-val vr">£{fmt(totalDue)}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Net margin</div><div className="mcard-val vg">£{fmt(netMargin)}</div></div>
        </div>

        {pendingDrivers.length > 0 && (
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="ch"><span className="card-title">Driver payroll — pending</span></div>
            {pendingDrivers.map(d => (
              <div className="pay-expandable" key={d.id}>
                <div className="prow clickable" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                  <span className="pd pd-out">OUT</span>
                  <div className="lr-info">
                    <div className="lr-name"><Link href={`/drivers/${d.id}`} className="lnk" onClick={e => e.stopPropagation()}>{d.first_name} {d.last_name}</Link></div>
                    <div className="lr-meta">{d.total_shifts || 0} shifts · {d.employment_type}</div>
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
                      <button className="btn btn-primary btn-sm" onClick={() => markPaid(d.id, d.first_name + ' ' + d.last_name, d.pending_pay || 0)}>Mark paid &amp; save proof</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <hr className="sep-line" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px' }}><span>Total due</span><span style={{ color: 'var(--red)' }}>£{fmt(totalDue)}</span></div>
          </div>
        )}

        <div className="card">
          <div className="ch"><span className="card-title">All transactions</span></div>
          {payments.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No payments recorded yet</div>}
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
