'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchDrivers, createDriver } from '@/lib/data';
import { fmt, fmtDate, isExp, sBadge } from '@/lib/helpers';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import FormField from '@/components/ui/FormField';

export default function DriversPage() {
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDrivers().then(setDrivers);
  }, []);

  const filtered = filter === 'all' ? drivers : drivers.filter(d => d.licence_category === filter);

  async function handleAddDriver(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newDriver: any = {
      initials: `${(fd.get('first_name') as string)[0]}${(fd.get('last_name') as string)[0]}`.toUpperCase(),
      first_name: fd.get('first_name') as string,
      last_name: fd.get('last_name') as string,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      address: fd.get('address') as string,
      emergency_contact: fd.get('emergency_contact') as string,
      emergency_phone: fd.get('emergency_phone') as string,
      licence_category: fd.get('licence_category') as string,
      employment_type: fd.get('employment_type') as string,
      status: fd.get('status') as string || 'available',
      avatar_color: '#e8f1fb',
      avatar_text_color: '#185fa5',
    };
    
    const created = await createDriver(newDriver);
    if (created) {
      setDrivers(prev => [created, ...prev]);
      toast('Driver added successfully ✓');
      closeModal();
    } else {
      toast('Error adding driver', 'err');
    }
  }

  function showAddDriver() {
    openModal(
      'Add new driver',
      <form id="add-driver-form" onSubmit={handleAddDriver}>
        <div style={{ background: 'linear-gradient(135deg,#E8460A 0%,#c93a08 100%)', borderRadius: '10px', padding: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }}>?</div>
          <div><div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>New driver profile</div><div style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>Fill in details below</div></div>
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>👤 Personal information</div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text2)' }}>Profile picture</label>
          <input type="file" id="df-pic" accept="image/*" style={{ fontSize: '13px', width: '100%' }} />
        </div>
        <div className="form-grid">
          <FormField label="First name" id="df-fn" name="first_name" required />
          <FormField label="Last name" id="df-ln" name="last_name" required />
          <FormField label="Phone" id="df-ph" name="phone" type="tel" />
          <FormField label="Email" id="df-em" name="email" type="email" />
        </div>
        <FormField label="Home address" id="df-addr" name="address" />
        <div className="form-grid"><FormField label="Emergency contact name" id="df-ec" name="emergency_contact" /><FormField label="Emergency phone" id="df-ep" name="emergency_phone" type="tel" /></div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>🚛 Licence &amp; compliance</div>
        <div className="form-grid">
          <FormField label="Licence category" id="df-lc" name="licence_category" options={['Class 1', 'Class 2', '7.5T', 'Van', 'Car']} required />
          <FormField label="Employment type" id="df-et" name="employment_type" options={[{ v: 'self-employed', l: 'Self-employed' }, { v: 'paye', l: 'PAYE' }]} required />
          <FormField label="Licence number" id="df-lno" />
          <FormField label="CPC number" id="df-cpn" />
          <FormField label="CPC expiry date" id="df-cpx" type="date" />
          <FormField label="Tacho card no." id="df-tac" />
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>🪪 Right to work</div>
        <div className="form-grid">
          <FormField label="RTW type" id="df-rtw" options={[{ v: 'passport', l: 'UK/EU Passport' }, { v: 'visa', l: 'Visa' }, { v: 'share_code', l: 'Share code' }]} />
          <FormField label="RTW expiry (if visa)" id="df-rtwx" type="date" />
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '.5px solid var(--border)' }}>💷 Payroll &amp; tax</div>
        <div className="form-grid">
          <FormField label="UTR number" id="df-utr" />
          <FormField label="NI number" id="df-ni" />
          <FormField label="Tax code" id="df-tax" />
          <FormField label="Status" id="df-status" name="status" options={[{ v: 'available', l: 'Available' }, { v: 'active', l: 'Active' }, { v: 'suspended', l: 'Suspended' }]} />
        </div>
      </form>,
      <><button className="btn btn-sm" onClick={closeModal}>Cancel</button><button type="submit" form="add-driver-form" className="btn btn-primary btn-sm" style={{ minWidth: '120px' }}>Add driver</button></>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="page-title">Drivers</div>
        <div className="tbar-right">
          <select className="btn btn-sm" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All categories</option>
            <option value="Class 1">Class 1</option>
            <option value="Class 2">Class 2</option>
            <option value="7.5T">7.5T</option>
            <option value="Van">Van</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={showAddDriver}>+ Add driver</button>
        </div>
      </div>
      <div className="content">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="dt">
            <thead><tr><th style={{ paddingLeft: '16px' }}>Driver</th><th>Licence</th><th>Type</th><th>RTW</th><th>CPC expiry</th><th>Total hrs</th><th>Total earned</th><th>Pending pay</th><th>Current order</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} onClick={() => window.location.href = `/drivers/${d.id}`}>
                  <td style={{ paddingLeft: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {d.avatar_url ? (
                        <div className="av av-s" style={{ backgroundImage: `url(${d.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center', border: 'none' }} />
                      ) : (
                        <div className="av av-s" style={{ background: d.avatar_color, color: d.avatar_text_color }}>{d.initials}</div>
                      )}
                      <div><div style={{ fontWeight: 500 }}>{d.first_name} {d.last_name}</div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>{d.phone}</div></div>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{d.licence_category}</span></td>
                  <td><span className="badge badge-gray">{d.employment_type}</span></td>
                  <td><span className={`badge badge-${d.rtw_type === 'passport' ? 'green' : isExp(d.rtw_expiry) ? 'red' : 'amber'}`}>{d.rtw_type === 'passport' ? 'Passport' : 'Visa'}</span></td>
                  <td>{d.cpc_expiry ? (isExp(d.cpc_expiry) ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>Expired</span> : fmtDate(d.cpc_expiry)) : '—'}</td>
                  <td>{fmt(d.total_hours)}h</td>
                  <td style={{ fontWeight: 600, color: 'var(--green-mid)' }}>£{fmt(d.total_earned)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--amber)' }}>{(d.pending_pay || 0) > 0 ? '£' + fmt(d.pending_pay) : '—'}</td>
                  <td>{d.current_order ? <span className="lnk">{d.current_order}</span> : '—'}</td>
                  <td><span className={`badge badge-${sBadge(d.status)}`}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
