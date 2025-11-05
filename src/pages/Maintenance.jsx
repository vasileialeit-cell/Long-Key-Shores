// src/pages/Maintenance.jsx
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

export default function Maintenance() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuId, setMenuId] = useState(null)

  // close menus when clicking outside
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
          .from('maintenance_requests')
          .select(`
            id, title, priority, status, created_at,
            properties ( name ),
            tenants ( app_users ( name, email ) )
          `)
          .order('created_at', { ascending: false })
        if (error) throw error
        if (!alive) return
        setRows(data || [])
      } catch (e) {
        if (!alive) return
        setError(e.message || 'Failed to load maintenance requests')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const list = useMemo(() => rows || [], [rows])

  // ------- Vee Style layout -------
  // Columns: Title | Tenant | Property | Priority | Status | menu
  const GRID = '1.6fr 1.1fr 1.1fr 0.9fr 0.9fr 44px'
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

  // pills for priority/status (keep your rounded blue/green feel)
  const pill = (bg, color='#0f172a') => ({
    display:'inline-block',
    padding:'6px 10px',
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 12,
    background: bg,
    color,
    border: '1px solid rgba(0,0,0,0.06)'
  })

  const PriorityPill = ({ p }) => {
    const v = (p || 'Medium').toLowerCase()
    if (v === 'high')   return <span style={pill('#fee2e2', '#991b1b')}>High</span>
    if (v === 'low')    return <span style={pill('#e2e8f0', '#0f172a')}>Low</span>
    return <span style={pill('#dbeafe', '#1e3a8a')}>Medium</span> // blue
  }

  const StatusPill = ({ s }) => {
    const v = (s || 'Open').toLowerCase()
    if (v === 'completed')   return <span style={pill('#dcfce7', '#166534')}>Completed</span> // green
    if (v === 'in progress') return <span style={pill('#e0e7ff', '#3730a3')}>In&nbsp;Progress</span> // indigo
    return <span style={pill('#dbeafe', '#1e3a8a')}>Open</span> // blue
  }

  function View(item){
    alert(`View request (coming soon): ${item?.title || ''}`)
    setMenuId(null)
  }
  function Edit(item){
    alert('Edit maintenance (coming soon)')
    setMenuId(null)
  }
  async function Delete(item){
    if (!confirm('Delete this maintenance request? This cannot be undone.')) return
    const { error } = await supabase.from('maintenance_requests').delete().eq('id', item.id)
    if (error) alert(error.message)
    else setRows(prev => prev.filter(r => r.id !== item.id))
    setMenuId(null)
  }

  return (
    <div style={container}>
      <h1 style={pageTitle}>Maintenance</h1>

      {/* Header strip aligned to the same GRID */}
      <div style={headerStrip}>
        <div style={headBox(GRID)}>
          <div style={hL}>Title</div>
          <div style={hC}>Tenant</div>
          <div style={hC}>Property</div>
          <div style={hC}>Priority</div>
          <div style={hC}>Status</div>
          <div style={hA} />
        </div>
      </div>

      {loading ? (
        <div style={emptyState}>Loading…</div>
      ) : error ? (
        <div style={errorState}>{error}</div>
      ) : list.length === 0 ? (
        <div style={emptyState}>No maintenance requests yet.</div>
      ) : (
        <div style={listWrap}>
          {list.map(item => {
            const tenantName = item.tenants?.app_users?.name || '—'
            const tenantEmail = item.tenants?.app_users?.email || ''
            const propertyName = item.properties?.name || '—'
            return (
              <div key={item.id} style={rowBox(GRID)}>
                {/* Title (left), subline shows tenant email subtly if available */}
                <div style={cL}>
                  <div style={name}>{item.title || '—'}</div>
                  {tenantEmail ? <div style={subline}>{tenantEmail}</div> : null}
                </div>

                {/* Tenant */}
                <div style={cC}>{tenantName}</div>

                {/* Property */}
                <div style={cC}>{propertyName}</div>

                {/* Priority */}
                <div style={cC}><PriorityPill p={item.priority} /></div>

                {/* Status */}
                <div style={cC}><StatusPill s={item.status} /></div>

                {/* Actions */}
                <div style={cA}>
                  <div style={menuWrap} onPointerDown={stop}>
                    <button
                      style={menuBtn}
                      onPointerDown={(e)=>{ e.stopPropagation(); setMenuId(id => id===item.id ? null : item.id) }}
                    >
                      ⋯
                    </button>
                    {menuId === item.id && (
                      <div style={menu}>
                        <div style={menuItem} onClick={()=>View(item)}>View</div>
                        <div style={menuItem} onClick={()=>Edit(item)}>Edit Task</div>
                        <div style={{...menuItem, color:'#dc2626'}} onClick={()=>Delete(item)}>Delete Task</div>
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
