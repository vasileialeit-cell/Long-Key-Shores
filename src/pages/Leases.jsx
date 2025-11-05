// src/pages/Leases.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

import {
  container, pageTitle,
  headerStrip, headerRow, hL, hC, hA,
  cardsWrap, cardRow, cardGrid, cL, cC, cA,
  name, subline,
  emptyState, errorState,
  menuWrap, menuBtn, menu, menuItem,
} from '../ui'

export default function Leases() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuId, setMenuId] = useState(null)

  // close menu outside
  useEffect(() => {
    const away = () => setMenuId(null)
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setError('')
        const { data, error } = await supabase
          .from('leases')
          .select(`
            id, monthly_rent, start_date, end_date, due_day,
            tenants ( app_users ( name ) ),
            properties ( name )
          `)
          .order('start_date', { ascending: false })
        if (error) throw error
        if (!alive) return
        setRows(data || [])
      } catch (e) {
        if (!alive) return
        setError(e.message || 'Failed to load leases')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const list = useMemo(() => rows || [], [rows])

  // Vee grid: Tenant/Property | Rent | Due Day | Dates | menu
  const GRID = '2fr 0.9fr 0.9fr 1.2fr 44px'
  const LIST_GAP = 12
  const PAD_Y = 10
  const PAD_X = 14

  const listWrap = { display: 'grid', gap: LIST_GAP, marginTop: 12 }
  const headBox  = (grid) => ({ ...headerRow(grid), marginTop: 8 })
  const rowBox   = (grid) => ({
    ...cardRow,
    gridTemplateColumns: grid,
    padding: `${PAD_Y}px ${PAD_X}px`,
  })

  function stop(e){ e.stopPropagation() }

  function formatMoney(v){
    return v != null ? `$${Number(v).toLocaleString()}` : '—'
  }
  function dateRange(s, e){
    if (!s || !e) return '—'
    return `${new Date(s).toLocaleDateString()} — ${new Date(e).toLocaleDateString()}`
  }

  // actions
  function View(item){ alert('View (coming soon)'); setMenuId(null) }
  function Edit(item){ alert('Edit lease (coming soon)'); setMenuId(null) }
  async function Delete(item){
    if (!confirm('Delete this lease? This cannot be undone.')) return
    const { error } = await supabase.from('leases').delete().eq('id', item.id)
    if (error) alert(error.message)
    else setRows(prev => prev.filter(r => r.id !== item.id))
    setMenuId(null)
  }

  return (
    <div style={container}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 style={pageTitle}>Leases</h1>
        <button
          style={{
            background:'#2563eb', color:'#fff', border:0, borderRadius:10,
            padding:'10px 14px', fontWeight:700, cursor:'pointer'
          }}
          onClick={() => alert('Add Lease (coming soon — we’ll wire your existing flow, not lose it)')}
        >
          + Add Lease
        </button>
      </div>

      <div style={headerStrip}>
        <div style={headBox(GRID)}>
          <div style={hL}>Tenant / Property</div>
          <div style={hC}>Rent</div>
          <div style={hC}>Due Day</div>
          <div style={hC}>Dates</div>
          <div style={hA} />
        </div>
      </div>

      {loading ? (
        <div style={emptyState}>Loading…</div>
      ) : error ? (
        <div style={errorState}>{error}</div>
      ) : list.length === 0 ? (
        <div style={emptyState}>No leases yet.</div>
      ) : (
        <div style={listWrap}>
          {list.map(item => (
            <div key={item.id} style={rowBox(GRID)}>
              <div style={cL}>
                <div style={name}>{item.tenants?.app_users?.name || '—'}</div>
                <div style={subline}>{item.properties?.name || '—'}</div>
              </div>

              <div style={cC}>{formatMoney(item.monthly_rent)}</div>
              <div style={cC}>{item.due_day ?? '—'}</div>
              <div style={cC}>{dateRange(item.start_date, item.end_date)}</div>

              <div style={cA}>
                <div style={menuWrap} onPointerDown={stop}>
                  <button
                    style={menuBtn}
                    onPointerDown={(e)=>{e.stopPropagation(); setMenuId(id => id===item.id ? null : item.id)}}
                  >⋯</button>
                  {menuId === item.id && (
                    <div style={menu}>
                      <div style={menuItem} onClick={()=>View(item)}>View</div>
                      <div style={menuItem} onClick={()=>Edit(item)}>Edit</div>
                      <div style={{...menuItem, color:'#dc2626'}} onClick={()=>Delete(item)}>Delete</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
