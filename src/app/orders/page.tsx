'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchOrders, fetchDrivers, fetchCompanies, createOrder, updateOrder, createOrderDriver, updateOrderDriverHours, deleteOrder } from '@/lib/data';
import { fmt, fmtDate, sBadge } from '@/lib/helpers';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import FormField from '@/components/ui/FormField';
import type { Order, Driver, Company } from '@/lib/types';

export default function OrdersPage() {
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchOrders(), fetchDrivers(), fetchCompanies()]).then(([o, d, co]) => {
      setOrders(o); setDrivers(d); setCompanies(co); setLoading(false);
    });
  }, []);

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  async function refreshOrders() { setOrders(await fetchOrders()); }

  async function handleCreateOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const coId = Number(fd.get('company_id'));
    if (!companies.find(c => c.id === coId)) return;
    const btn = document.querySelector('button[form="create-order-form"]') as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    const { data: created, error } = await createOrder({
      company_id: coId, placed_by: fd.get('placed_by') as string,
      start_datetime: fd.get('start_datetime') as string, start_address: fd.get('start_address') as string,
      end_address: fd.get('end_address') as string, licence_required: fd.get('licence_required') as string,
      company_rate: Number(fd.get('company_rate')) || 20, min_hours: Number(fd.get('min_hours')) || 8,
      drivers_needed: Number(fd.get('drivers_needed')) || 1, status: 'draft', hours_done: 0,
    } as Partial<Order>);
    if (created) { await refreshOrders(); toast('Order created ✓'); closeModal(); }
    else {
      if (btn) { btn.disabled = false; btn.textContent = 'Create order'; }
      toast(`Error: ${error?.message || 'Failed to create order'}`, 'err');
    }
  }

  async function handleAssignDriver(e: React.FormEvent<HTMLFormElement>, orderId: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const driverId = Number(fd.get('adr'));
    const driverRate = Number(fd.get('driver_rate')) || 14;
    if (!driverId) return toast('Please select a driver', 'err');

    const btn = document.querySelector('button[form="assign-driver-form"]') as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    // Create order_drivers record (proper junction table)
    const { data: od, error } = await createOrderDriver({ order_id: orderId, driver_id: driverId, driver_rate: driverRate, start_address: fd.get('driver_addr') as string || undefined });
    if (!od) {
      if (btn) { btn.disabled = false; btn.textContent = 'Assign driver'; }
      return toast(`Error: ${error?.message || 'Failed to assign driver'}`, 'err');
    }

    // Update order status to active
    await updateOrder(orderId, { status: 'active' } as Partial<Order>);
    await refreshOrders();
    toast('Driver assigned ✓');
    closeModal();
  }

  async function handleCompleteOrder(e: React.FormEvent<HTMLFormElement>, orderId: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const hrs = Number(fd.get('hours_done'));
    if (hrs <= 0) return toast('Enter valid hours done', 'err');

    const btn = document.querySelector('button[form="complete-order-form"]') as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    const hours = Number(fd.get('hours_done')) || 8;
    await updateOrder(orderId, { status: 'completed', hours_done: hours, notes: fd.get('notes') as string } as Partial<Order>);
    await updateOrderDriverHours(orderId, hours);
    await refreshOrders();
    toast('Order completed ✓');
    closeModal();
  }

  async function handleDeleteOrder(orderId: number) {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      const deleted = await deleteOrder(orderId);
      if (deleted) {
        await refreshOrders();
        toast('Order deleted ✓');
      } else {
        toast('Error deleting order', 'err');
      }
    }
  }

  function showNewOrder() {
    openModal('Create new order',
      <form id="create-order-form" onSubmit={handleCreateOrder}>
        <FormField label="Company" id="of-co" name="company_id" options={[{ v: '', l: '— Select company —' }, ...companies.map(c => ({ v: String(c.id), l: c.name }))]} required />
        <div className="form-grid">
          <FormField label="Placed by" id="of-pb" name="placed_by" />
          <FormField label="Start date/time" id="of-sd" name="start_datetime" type="datetime-local" />
          <FormField label="Start address" id="of-sa" name="start_address" required />
          <FormField label="End address" id="of-ea" name="end_address" />
          <FormField label="Licence required" id="of-lr" name="licence_required" options={[{ v: '', l: '— Any —' }, { v: 'Class 1', l: 'Class 1' }, { v: 'Class 2', l: 'Class 2' }, { v: '7.5T', l: '7.5T' }, { v: 'Van', l: 'Van' }]} />
          <FormField label="Company rate (£/hr)" id="of-cr" name="company_rate" type="number" />
          <FormField label="Min hours" id="of-mh" name="min_hours" type="number" />
          <FormField label="Drivers needed" id="of-dn" name="drivers_needed" type="number" value={1} />
        </div>
        <FormField label="Notes" id="of-notes" name="notes" />
      </form>,
      <><button className="btn btn-sm" onClick={closeModal}>Cancel</button><button type="submit" form="create-order-form" className="btn btn-primary btn-sm">Create order</button></>
    );
  }

  function showAssignDriver(orderId: number, licRequired: string) {
    const available = drivers.filter(d => d.status === 'active' || d.status === 'available');
    openModal('Assign driver to order',
      <form id="assign-driver-form" onSubmit={(e) => handleAssignDriver(e, orderId)}>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>Licence needed: <strong>{licRequired || 'Any'}</strong></div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>Select driver <span style={{ color: 'var(--red)' }}>*</span></label>
          {available.map(dr => (
            <label key={dr.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'var(--bg)', borderRadius: 'var(--r-sm)', marginBottom: '8px', cursor: 'pointer', border: '.5px solid var(--border)' }}>
              <input type="radio" name="adr" value={dr.id} style={{ accentColor: 'var(--brand)' }} />
              <div className="av av-s" style={{ background: dr.avatar_color, color: dr.avatar_text_color }}>{dr.initials}</div>
              <div className="lr-info"><div className="lr-name">{dr.first_name} {dr.last_name}</div><div className="lr-meta">{dr.licence_category} · {dr.status}</div></div>
              <span className={`badge badge-${sBadge(dr.status)}`}>{dr.status}</span>
            </label>
          ))}
        </div>
        <div className="form-grid"><FormField label="Driver rate (£/hr)" id="ad-rate" name="driver_rate" type="number" value={14} /><FormField label="Driver start address" id="ad-addr" name="driver_addr" /></div>
      </form>,
      <><button type="button" className="btn btn-sm" onClick={closeModal}>Cancel</button><button type="submit" form="assign-driver-form" className="btn btn-primary btn-sm">Assign driver</button></>
    );
  }

  function showCompleteOrder(orderId: number) {
    const order = orders.find(o => o.id === orderId);
    openModal(`Complete order — ${order?.order_ref || ''}`,
      <form id="complete-order-form" onSubmit={(e) => handleCompleteOrder(e, orderId)}>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>{order?.company_name} · Driver: <strong>{order?.driver_names || '—'}</strong></div>
        <FormField label="Total hours done" id="co-hrs" name="hours_done" type="number" required />
        <FormField label="Notes" id="co-notes" name="notes" />
      </form>,
      <><button type="button" className="btn btn-sm" onClick={closeModal}>Cancel</button><button type="submit" form="complete-order-form" className="btn btn-primary btn-sm">Mark complete</button></>
    );
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}><div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style><div style={{ color: 'var(--text2)', fontWeight: 500 }}>Loading orders...</div></div>;

  return (
    <>
      <div className="topbar">
        <div className="page-title">Orders</div>
        <div className="tbar-right">
          <select className="btn btn-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={showNewOrder}>+ New order</button>
        </div>
      </div>
      <div className="content">
        {filtered.length === 0 && <div className="card" style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px' }}>No orders found</div>}
        {filtered.map(o => (
          <div className="ocard" key={o.id}>
            <div className="ocard-top">
              <div>
                <div className="ocard-id">{o.order_ref} · <Link href={`/companies/${o.company_id}`} className="lnk">{o.company_name}</Link> · Placed by {o.placed_by}</div>
                <div className="ocard-title">{o.start_address}{o.end_address ? ` → ${o.end_address}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`badge badge-${sBadge(o.status)}`}>{o.status}</span>
                {o.status === 'draft' && <button className="btn btn-primary btn-sm" onClick={() => showAssignDriver(o.id, o.licence_required || '')}>Assign driver</button>}
                {o.status === 'active' && <button className="btn btn-primary btn-sm" onClick={() => showCompleteOrder(o.id)}>Mark complete</button>}
                <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'rgba(153, 31, 31, 0.3)', padding: '4px 8px' }} onClick={() => handleDeleteOrder(o.id)}>Delete</button>
              </div>
            </div>
            <div className="stat-strip">
              <div className="ss"><div className="ss-l">Date</div><div className="ss-v">{fmtDate(o.start_datetime)}</div></div>
              <div className="ss"><div className="ss-l">Licence</div><div className="ss-v">{o.licence_required || '—'}</div></div>
              <div className="ss"><div className="ss-l">Min hrs</div><div className="ss-v">{o.min_hours}h</div></div>
              <div className="ss"><div className="ss-l">Co. rate</div><div className="ss-v">£{o.company_rate}/hr</div></div>
              <div className="ss"><div className="ss-l">Done</div><div className="ss-v">{fmt(o.hours_done)}h</div></div>
            </div>
            {o.driver_names ? (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text3)' }}>Driver: <strong>{o.driver_names}</strong></div>
            ) : (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--amber)' }}>⚠ No driver assigned yet</div>
            )}
            {(o.status === 'active' || o.status === 'completed') && (
              <div className="order-stages">
                <div className="stage-row done"><div className="stage-icon">✅</div><div className="stage-info"><div className="stage-label">Order placed — company confirmation</div><div className="stage-meta">{fmtDate(o.created_at)}</div></div></div>
                <div className={`stage-row ${o.driver_names ? 'done' : 'active-stage'}`}><div className="stage-icon">{o.driver_names ? '✅' : '⏳'}</div><div className="stage-info"><div className="stage-label">{o.driver_names ? `Driver assigned — ${o.driver_names}` : 'Assign driver'}</div></div></div>
                {o.status === 'completed' && <div className="stage-row done"><div className="stage-icon">✅</div><div className="stage-info"><div className="stage-label">Job completed — {fmt(o.hours_done)}h logged</div></div></div>}
                {o.status === 'active' && <div className="stage-row active-stage"><div className="stage-icon">⏳</div><div className="stage-info"><div className="stage-label">Job completion &amp; hours proof</div><div className="stage-meta">Driver to confirm hours on completion</div></div></div>}
                <div className={`stage-row ${o.status === 'completed' ? 'done' : 'pending-stage'}`}><div className="stage-icon">{o.status === 'completed' ? '✅' : '🔲'}</div><div className="stage-info"><div className="stage-label">Invoice sent</div></div></div>
                <div className="stage-row pending-stage"><div className="stage-icon">🔲</div><div className="stage-info"><div className="stage-label">Payment received</div></div></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
