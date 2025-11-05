import React from 'react'
export default function Modal({ title, open, onClose, children }) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', width: 'min(640px, 92vw)' }}>
        <div style={{ display: 'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #e5e7eb' }}>
          <strong>{title}</strong>
          <button onClick={onClose} style={{ border:'1px solid #e5e7eb', background:'#fff', color:'#111827', borderRadius:8, padding:'6px 8px', cursor:'pointer' }} aria-label="Close">
            Close
          </button>
        </div>
        <div style={{ padding:'12px 16px' }}>{children}</div>
      </div>
    </div>
  )
}
