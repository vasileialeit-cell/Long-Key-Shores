// src/components/Topbar.jsx
import React, { useState, useRef, useEffect } from 'react'

export default function Topbar({ title = '', status = '', onLogout }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <header style={s.wrap}>
      <div style={s.left}>
        <div style={s.title}>{title || 'Dashboard'}</div>
        {status ? <div style={s.status}>{status}</div> : null}
      </div>

      <div style={s.right}>
        <button aria-label="Notifications" style={s.iconBtn}>🔔</button>

        {/* Avatar + dropdown */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            aria-label="Profile"
            style={s.avatarBtn}
            onClick={() => setOpen(v => !v)}
          >
            <span style={{ fontWeight: 700 }}>VL</span>
          </button>

          {open && (
            <div style={s.menu}>
              <button style={s.menuItem} onClick={() => { setOpen(false); alert('Profile coming soon'); }}>
                Profile
              </button>
              <button style={s.menuItem} onClick={() => { setOpen(false); onLogout?.() }}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

const s = {
  wrap: {
    height: 64,
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  left: { display: 'flex', alignItems: 'baseline', gap: 14, minWidth: 0 },
  title: { fontSize: 18, fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' },
  status: { color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 999, border: '1px solid #e5e7eb',
    background: '#fff', cursor: 'pointer'
  },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 999, border: '1px solid #e5e7eb',
    background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#111827'
  },
  menu: {
    position: 'absolute', right: 0, top: 44, minWidth: 160,
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
    boxShadow: '0 10px 20px rgba(0,0,0,0.08)', padding: 6, zIndex: 20,
  },
  menuItem: {
    width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
    padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  },
}
