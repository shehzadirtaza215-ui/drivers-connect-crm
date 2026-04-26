'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchInvoices, fetchCompanies, createInvoice, updateInvoice } from '@/lib/data';
import { fmt, fmtDate, sBadge } from '@/lib/helpers';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import FormField from '@/components/ui/FormField';
import type { Invoice, Company } from '@/lib/types';

export default function InvoicesPage() {
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchCompanies()]).then(([inv, co]) => {
      setInvoices(inv);
      setCompanies(co);
      setLoading(false);
    });
  }, []);

  const totals = { total: 0, paid: 0, outstanding: 0, overdue: 0 };
  invoices.forEach(i => { totals.total += i.amount; if (i.status === 'paid') totals.paid += i.amount; if (i.status === 'sent' || i.status === 'overdue') totals.outstanding += i.amount; if (i.status === 'overdue') totals.overdue += i.amount; });

  async function updateInvoiceStatus(id: number, status: string) {
    const updates: Partial<Invoice> = { status } as Partial<Invoice>;
    if (status === 'paid') (updates as any).paid_date = new Date().toISOString().split('T')[0];
    const result = await updateInvoice(id, updates);
    if (result) {
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
      toast(`Invoice ${status === 'sent' ? 'sent' : status === 'paid' ? 'marked paid' : 'updated'} ✓`);
    } else {
      toast('Error updating invoice', 'err');
    }
  }

  async function handleCreateInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const companyId = Number(fd.get('company_id'));
    const co = companies.find(c => c.id === companyId);
    if (!co) return toast('Select a company', 'err');

    const newInvoice: Partial<Invoice> = {
      company_id: companyId,
      amount: Number(fd.get('amount')) || 0,
      issued_date: new Date().toISOString().split('T')[0],
      due_date: fd.get('due_date') as string,
      status: 'sent'
    };

    const created = await createInvoice(newInvoice);
    if (created) {
      // Re-fetch to get company_name from join
      const freshInvoices = await fetchInvoices();
      setInvoices(freshInvoices);
      toast('Invoice created ✓');
      closeModal();
    } else {
      toast('Error creating invoice', 'err');
    }
  }

  function showNewInvoice() {
    openModal('New invoice',
      <form id="new-invoice-form" onSubmit={handleCreateInvoice}>
        <FormField label="Company" id="if-co" name="company_id" options={[{ v: '', l: '— Select —' }, ...companies.map(c => ({ v: String(c.id), l: c.name }))]} required />
        <div className="form-grid">
          <FormField label="Amount (£)" id="if-amt" name="amount" type="number" required />
          <FormField label="Due date" id="if-due" name="due_date" type="date" />
        </div>
        <FormField label="Notes" id="if-notes" name="notes" />
      </form>,
      <><button className="btn btn-sm" onClick={closeModal}>Cancel</button><button type="submit" form="new-invoice-form" className="btn btn-primary btn-sm">Create</button></>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: 'var(--text2)', fontWeight: 500 }}>Loading invoices...</div>
      </div>
    );
  }

  return (
    <>
      <div className="topbar"><div className="page-title">Invoices</div><div className="tbar-right"><button className="btn btn-primary btn-sm" onClick={showNewInvoice}>+ New invoice</button></div></div>
      <div className="content">
        <div className="g4" style={{ marginBottom: '16px' }}>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Total invoiced</div><div className="mcard-val">£{fmt(totals.total)}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Paid</div><div className="mcard-val vg">£{fmt(totals.paid)}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Outstanding</div><div className="mcard-val va">£{fmt(totals.outstanding)}</div></div>
          <div className="mcard" style={{ cursor: 'default' }}><div className="mcard-label">Overdue</div><div className="mcard-val vr">£{fmt(totals.overdue)}</div></div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="dt">
            <thead><tr><th style={{ paddingLeft: '14px' }}>Invoice</th><th>Company</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ paddingLeft: '14px' }} className="mono">{inv.invoice_ref}</td>
                  <td><Link href={`/companies/${inv.company_id}`} className="lnk">{inv.company_name}</Link></td>
                  <td>{fmtDate(inv.issued_date)}</td>
                  <td style={{ color: inv.status === 'overdue' ? 'var(--red)' : undefined }}>{fmtDate(inv.due_date)}</td>
                  <td style={{ fontWeight: 700 }}>£{fmt(inv.amount)}</td>
                  <td><span className={`badge badge-${sBadge(inv.status)}`}>{inv.status}</span></td>
                  <td>
                    {inv.status === 'draft' && <button className="btn btn-sm btn-primary" onClick={() => updateInvoiceStatus(inv.id, 'sent')}>Send</button>}
                    {(inv.status === 'sent' || inv.status === 'overdue') && <button className="btn btn-sm" onClick={() => updateInvoiceStatus(inv.id, 'paid')}>Mark paid</button>}
                    {inv.status === 'paid' && <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
