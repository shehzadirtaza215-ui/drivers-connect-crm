'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchDrivers, fetchCompanies, fetchOrders } from '@/lib/data';

export default function Sidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState({ drivers: 0, companies: 0, orders: 0 });

  useEffect(() => {
    async function loadCounts() {
      const [drivers, companies, orders] = await Promise.all([
        fetchDrivers(),
        fetchCompanies(),
        fetchOrders(),
      ]);
      setCounts({
        drivers: drivers.length,
        companies: companies.length,
        orders: orders.filter(o => o.status === 'draft' || o.status === 'active').length,
      });
    }
    loadCounts();

    // Refresh counts every 30 seconds
    const iv = setInterval(loadCounts, 30000);
    return () => clearInterval(iv);
  }, []);

  const navItems = [
    { section: 'Main', items: [
      { href: '/', label: 'Dashboard', icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg> },
    ]},
    { section: 'People', items: [
      { href: '/drivers', label: 'Drivers', badge: counts.drivers > 0 ? counts.drivers : null, icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="4.5" r="2.5"/><path d="M1.5 13c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5"/></svg> },
      { href: '/companies', label: 'Companies', badge: counts.companies > 0 ? counts.companies : null, icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="5" width="11" height="8" rx="1"/><path d="M4.5 5V3a1 1 0 011-1h3a1 1 0 011 1v2"/></svg> },
    ]},
    { section: 'Operations', items: [
      { href: '/orders', label: 'Orders', badge: counts.orders > 0 ? counts.orders : null, icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="1.5" width="11" height="11" rx="1"/><line x1="4" y1="5" x2="10" y2="5"/><line x1="4" y1="7.5" x2="8" y2="7.5"/><line x1="4" y1="10" x2="7" y2="10"/></svg> },
      { href: '/shifts', label: 'Shifts', icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5.5"/><polyline points="7,3.5 7,7 9.5,8.5"/></svg> },
    ]},
    { section: 'Finance', items: [
      { href: '/invoices', label: 'Invoices', icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2.5" y="1" width="9" height="12" rx="1"/><line x1="5" y1="4.5" x2="9" y2="4.5"/><line x1="5" y1="7" x2="9" y2="7"/><line x1="5" y1="9.5" x2="7" y2="9.5"/></svg> },
      { href: '/payments', label: 'Payments', icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3.5" width="12" height="8" rx="1"/><line x1="1" y1="6.5" x2="13" y2="6.5"/><circle cx="4" cy="9.5" r="1" fill="currentColor"/></svg> },
      { href: '/compliance', label: 'Compliance', icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 1L1.5 4v4c0 3.3 2.5 6 5.5 6.5C13 13.5 12.5 8 12.5 8V4L7 1z"/><polyline points="4.5,7 6.5,9 10,5.5"/></svg> },
    ]},
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-mark">Drivers<span>Connect</span></div>
        <div className="logo-sub">CRM · ADMIN</div>
      </div>
      <div className="nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="nav-sec">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`ni ${isActive(item.href) ? 'active' : ''}`}
              >
                {item.icon}
                {item.label}
                {item.badge && <span className="nbadge">{item.badge}</span>}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="ubar">
        <div className="uav">EC</div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500 }}>Ertaza C.</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Admin</div>
        </div>
      </div>
    </div>
  );
}
