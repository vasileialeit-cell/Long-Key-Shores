// src/components/PropertyView.jsx
import React from 'react'
import styles from '../styles/styles'

const row = { display:'grid', gridTemplateColumns:'130px 1fr', gap:12, marginBottom:10 }
const title = { fontWeight:700, fontSize:18, margin:'0 0 8px' }
const pill = (color='#0ea5e9') => ({
  display:'inline-block', padding:'4px 10px', borderRadius:999,
  background: color, color:'#fff', fontWeight:600, fontSize:12
})

export default function PropertyView({ open, onClose, property, leases }) {
  if (!open) return null
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,0.35)',
      display:'flex', justifyContent:'flex-end', zIndex:1000
    }} onClick={onClose}>
      <aside
        onClick={e => e.stopPropagation()}
        style={{
          width: '520px', maxWidth:'92vw', height:'100vh', background:'#fff',
          boxShadow:'-12px 0 40px rgba(15,23,42,0.3)', padding:22, overflow:'auto'
        }}
      >
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <h3 style={title}>Property Details</h3>
          <button onClick={onClose} style={styles.ghostButton}>✕</button>
        </div>

        {!property ? (
          <div>Loading…</div>
        ) : (
          <>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:20, fontWeight:800 }}>{property.name || '—'}</div>
              <div style={{ color:'#64748b' }}>{property.address || '—'}</div>
              <div style={{ marginTop:8 }}>
                <span style={pill(property.status === 'Inactive' ? '#6b7280' : '#10b981')}>
                  {property.status || 'Active'}
                </span>
              </div>
            </div>

            <div style={row}><div>Monthly Rent</div><div><b>
              {property.monthly_rent != null ? `$${Number(property.monthly_rent).toLocaleString()}` : '—'}
            </b></div></div>

            <hr style={{ border:'none', borderTop:'1px solid #e5e7eb', margin:'16px 0' }} />

            <div style={{ display:'grid', gap:8 }}>
              <div style={{ fontWeight:700 }}>Leases</div>
              {(!leases || leases.length === 0) ? (
                <div style={{ color:'#64748b' }}>No leases on this property.</div>
              ) : (
                leases.map(l => (
                  <div key={l.id} style={{
                    border:'1px solid #e5e7eb', borderRadius:12, padding:12, background:'#fafafa'
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontWeight:700 }}>
                        {l.tenant_name || 'Tenant'} • {l.status || '—'}
                      </div>
                      <div style={{ color:'#64748b', fontSize:12 }}>
                        {l.start_date} → {l.end_date}
                      </div>
                    </div>
                    <div style={{ marginTop:6, color:'#334155' }}>
                      Rent: {l.monthly_rent != null ? `$${Number(l.monthly_rent).toLocaleString()}` : '—'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
