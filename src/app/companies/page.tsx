'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DEMO_COMPANIES } from '@/lib/demo-data';
import { fmt } from '@/lib/helpers';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import FormField from '@/components/ui/FormField';

export default function CompaniesPage() {
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const [companies, setCompanies] = useState(DEMO_COMPANIES);

  function handleAddCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newId = DEMO_COMPANIES.length > 0 ? Math.max(...DEMO_COMPANIES.map(c => c.id)) + 1 : 1;
    const newCompany: any = {
      id: newId,
      code: fd.get('code') as string,
      name: fd.get('name') as string,
      contact_name: fd.get('contact_name') as string,
      contact_email: fd.get('contact_email') as string,
      contact_phone: fd.get('contact_phone') as string,
      address: fd.get('address') as string,
      licence_required: fd.get('licence_required') as string,
      rate_per_hour: Number(fd.get('rate_per_hour')) || 0,
      payment_terms_days: Number(fd.get('payment_terms_days')) || 14,
      status: 'active',
      avatar_color: '#1a1a2e',
      avatar_text_color: '#fff',
      created_at: new Date().toISOString(),
      total_orders: 0,
      total_hours: 0,
      total_billed: 0,
      total_paid: 0,
      outstanding: 0,
      driver_count: 0
    };
    DEMO_COMPANIES.push(newCompany);
    setCompanies([...DEMO_COMPANIES]);
    toast('Company added ✓');
    closeModal();
  }

  function showAddCompany() {
    openModal('Add new company',
      <form id="add-company-form" onSubmit={handleAddCompany}>
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)', borderRadius: '10px', padding: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#fff', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>CO</div>
          <div><div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>New company profile</div><div style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>Fill in details below</div></div>
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>🏢 Company details</div>
        <div className="form-grid"><FormField label="Company code (e.g. DHL)" id="cf-code" name="code" required /><FormField label="Full company name" id="cf-name" name="name" required /></div>
        <FormField label="Company address" id="cf-addr" name="address" />
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>📞 Contact person</div>
        <div className="form-grid"><FormField label="Contact name" id="cf-cn" name="contact_name" /><FormField label="Contact email" id="cf-ce" name="contact_email" type="email" /><FormField label="Contact phone" id="cf-cp" name="contact_phone" type="tel" /></div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>💷 Rates &amp; requirements</div>
        <div className="form-grid">
          <FormField label="Licence required" id="cf-lic" name="licence_required" options={[{ v: '', l: 'Any licence' }, { v: 'Class 1', l: 'Class 1 (C+E)' }, { v: 'Class 2', l: 'Class 2 (C)' }, { v: '7.5T', l: '7.5 Tonne' }, { v: 'Van', l: 'Van' }]} />
          <FormField label="Our charge rate (£/hr)" id="cf-rate" name="rate_per_hour" type="number" />
          <FormField label="Payment terms (days)" id="cf-terms" name="payment_terms_days" type="number" value={14} />
        </div>
      </form>,
      <><button className="btn btn-sm" onClick={closeModal}>Cancel</button><button type="submit" form="add-company-form" className="btn btn-primary btn-sm" style={{ minWidth: '130px' }}>Add company</button></>
    );
  }

  return (
    <>
      <div className="topbar"><div className="page-title">Companies</div><div className="tbar-right"><button className="btn btn-primary btn-sm" onClick={showAddCompany}>+ Add company</button></div></div>
      <div className="content">
        <div className="cgrid">
          {companies.map(c => (
            <Link href={`/companies/${c.id}`} key={c.id} className="ccard">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="av av-m sq" style={{ background: c.avatar_color, color: c.avatar_text_color, fontSize: '10px', fontWeight: 800 }}>{c.code}</div>
                <div><div style={{ fontWeight: 600, fontSize: '14px' }}>{c.name}</div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>{c.driver_count} drivers</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9.5px', color: 'var(--text3)' }}>Orders</div><div style={{ fontWeight: 700 }}>{c.total_orders}</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9.5px', color: 'var(--text3)' }}>Hours</div><div style={{ fontWeight: 700 }}>{fmt(c.total_hours)}h</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9.5px', color: 'var(--text3)' }}>Billed</div><div style={{ fontWeight: 700 }}>£{fmt(c.total_billed)}</div></div>
              </div>
              <div className="vsbar"><div className="vsbar-label"><span style={{ color: 'var(--green-mid)' }}>Paid</span><span style={{ fontWeight: 600, color: 'var(--green-mid)' }}>£{fmt(c.total_paid)}</span></div></div>
              <div className="prog" style={{ marginBottom: '8px' }}><div className="prog-fill pg" style={{ width: `${c.total_billed && c.total_billed > 0 ? Math.round(((c.total_paid || 0) / c.total_billed) * 100) : 0}%` }}></div></div>
              <div className="vsbar"><div className="vsbar-label"><span style={{ color: (c.outstanding || 0) > 0 ? 'var(--red)' : 'var(--text3)' }}>Outstanding</span><span style={{ fontWeight: 600, color: (c.outstanding || 0) > 0 ? 'var(--red)' : 'var(--text3)' }}>£{fmt(c.outstanding)}</span></div></div>
            </Link>
          ))}
          <div className="ccard empty-card" style={{ minHeight: '200px' }} onClick={showAddCompany}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/></svg>
            <span style={{ fontSize: '13px' }}>Add company</span>
          </div>
        </div>
      </div>
    </>
  );
}
