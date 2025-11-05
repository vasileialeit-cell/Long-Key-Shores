// src/pages/Tenants.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

// shared UI tokens and helpers
import {
  container, pageTitle,
  headerStrip, headerRow, hL, hC, hA,       // header helpers
  cardsWrap, cardRow, cardGrid, cL, cC, cA, // row/grid helpers
  name, subline,
  emptyState, errorState,
  menuWrap, menuBtn, menu, menuItem,
} from '../ui'

export default function Tenants() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuId, setMenuId] = useState(null)

  // close any open “…” menu on outside click
  useEffect(() => {
    const away = () => setMenuId(null)
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [])

  // fetch tenants + their property via leases
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setError('')
        const { data, error } = await supabase
          .from('tenants')
          .select(`
            id,
            phone,
            app_users ( name, email ),
            leases:leases_tenant_id_fkey ( id, properties ( name ) )
          `)
          .order('id', { ascending: true })

        if (error) throw error
        if (!alive) return
        setRows(data || [])
      } catch (e) {
        if (!alive) return
        setError(e.message || 'Failed to load tenants')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // ----- layout tuning: column widths & row spacing -----
  // grid columns: [Tenant] [Email] [Property] [menu]
  // tweak the numbers to move columns left/right:
  // - first value controls how wide the “Tenant” column is
  // - second is “Email”
  // - third is “Property”
  // - last is the small gutter for the “…” button
  const GRID = '1.55fr 1.15fr 0.95fr 44px'

  // vertical spacing between rows
  const LIST_GAP = 12
  // internal padding inside each card row (top/bottom left/right)
  const PAD_Y = 10   // reduce for thinner rows (e.g., 8–10)
  const PAD_X = 14

  // light wrapper that keeps header & rows aligned by sharing GRID
  const listWrap = { display: 'grid', gap: LIST_GAP, marginTop: 12 }
  const headBox  = (grid) => ({ ...headerRow(grid), marginTop: 8 })
  const rowBox   = (grid) => ({
    ...cardRow,
    gridTemplateColumns: grid,
    padding: `${PAD_Y}px ${PAD_X}px`,
  })

  function stop(e){ e.stopPropagation() }

  // actions (view/edit are placeholders for now)
  function View(t){ alert(`View tenant (coming soon): ${t.app_users?.name || '—'}`); setMenuId(null) }
  function Edit(t){ alert('Edit tenant coming soon'); setMenuId(null) }
  async function Delete(t){
    if (!confirm('Delete this tenant? This cannot be undone.')) return
    const { error } = await supabase.from('tenants').delete().eq('id', t.id)
    if (error) alert(error.message)
    else setRows(prev => prev.filter(r => r.id !== t.id))
    setMenuId(null)
  }

  const list = useMemo(() => rows || [], [rows])

  return (
    <div style={container}>
      <h1 style={pageTitle}>Tenants</h1>

      {/* Header strip (sticky spacing + title row) */}
      <div style={headerStrip}>
        <div style={headBox(GRID)}>
          <div style={hL}>Tenant</div>
          <div style={hC}>Email</div>
          <div style={hC}>Property</div>
          <div style={hA} />
        </div>
      </div>

      {/* states */}
      {loading ? (
        <div style={emptyState}>Loading…</div>
      ) : error ? (
        <div style={errorState}>{error}</div>
      ) : list.length === 0 ? (
        <div style={emptyState}>No tenants yet.</div>
      ) : (
        <div style={listWrap}>
          {list.map(t => {
            const propName = t.leases?.[0]?.properties?.name || '—'
            const email    = t.app_users?.email || '—'
            return (
              <div key={t.id} style={rowBox(GRID)}>
                {/* left: tenant name + phone subline */}
                <div style={cL}>
                  <div style={name}>{t.app_users?.name || '—'}</div>
                  {t.phone ? <div style={subline}>{t.phone}</div> : null}
                </div>

                {/* middle columns */}
                <div style={cC}>{email}</div>
                <div style={cC}>{propName}</div>

                {/* actions */}
                <div style={cA}>
                  <div style={menuWrap} onPointerDown={stop}>
                    <button
                      style={menuBtn}
                      onPointerDown={(e)=>{e.stopPropagation(); setMenuId(id => id===t.id ? null : t.id)}}
                    >
                      ⋯
                    </button>
                    {menuId === t.id && (
                      <div style={menu} onClick={(e)=>e.stopPropagation()}>
                        <div style={menuItem} onClick={()=>View(t)}>View</div>
                        <div style={menuItem} onClick={()=>Edit(t)}>Edit</div>
                        <div style={{...menuItem, color:'#dc2626'}} onClick={()=>Delete(t)}>Delete</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
