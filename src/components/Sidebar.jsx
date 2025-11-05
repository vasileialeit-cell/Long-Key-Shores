// src/components/Sidebar.jsx
import React from 'react'

export default function Sidebar({ tab, setTab }) {
  const items = [
    { key: 'dashboard',  label: 'Dashboard',  icon: '🏡' },
    { key: 'properties', label: 'Properties', icon: '🏘️' },
    { key: 'tenants',    label: 'Tenants',    icon: '👥' },
    { key: 'leases',     label: 'Leases',     icon: '📄' },
    { key: 'maintenance',label: 'Maintenance',icon: '🛠️' },
    { key: 'documents',  label: 'Documents',  icon: '📎' },
    { key: 'analytics',  label: 'Analytics',  icon: '📊' }, // NEW
  ]

  return (
    <aside style={s.wrap}>
      <div style={s.brand}>
        <div style={s.logoMark}>LKS</div>
        <div>
          <div style={s.brandName}>Long Key Shores</div>
          <div style={s.brandSub}>Property Manager</div>
        </div>
      </div>

      <nav style={s.nav}>
        {items.map(it => {
          const active = tab === it.key
          return (
            <button
              key={it.key}
              onClick={() => setTab(it.key)}
              style={{ ...s.navItem, ...(active ? s.navItemActive : null) }}
            >
              <span style={s.icon}>{it.icon}</span>
              <span>{it.label}</span>
              {active && <span style={s.activeDot} />}
            </button>
          )
        })}
      </nav>

      <div style={s.footerNote}>
        <span style={{ opacity: 0.7 }}>©</span> Long Key Shores
      </div>
    </aside>
  )
}

const s = {
  wrap: {
    width: 240, minWidth: 240, background: '#0f172a', color: '#e5e7eb',
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    borderRight: '1px solid #0b1222', position: 'sticky', top: 0,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px', borderBottom: '1px solid #111827' },
  logoMark: {
    width: 38, height: 38, borderRadius: 10,
    background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
    display: 'grid', placeItems: 'center', fontWeight: 800, color: '#0f172a', letterSpacing: 0.5,
  },
  brandName: { fontWeight: 800, fontSize: 14, lineHeight: '16px' },
  brandSub: { fontSize: 12, color: '#94a3b8', lineHeight: '16px' },
  nav: { display: 'grid', gap: 6, padding: 12 },
  navItem: {
    appearance: 'none', background: 'transparent', border: 'none', color: '#e5e7eb',
    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', position: 'relative', fontSize: 14,
  },
  navItemActive: { background: 'rgba(59,130,246,0.16)', outline: '1px solid rgba(59,130,246,0.35)' },
  icon: { width: 22, textAlign: 'center' },
  activeDot: { position: 'absolute', right: 10, width: 8, height: 8, borderRadius: 999, background: '#38bdf8' },
  footerNote: { marginTop: 'auto', padding: '12px 16px', fontSize: 12, color: '#94a3b8', borderTop: '1px solid #111827' },
}
