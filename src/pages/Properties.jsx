// src/pages/Properties.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Properties({
  properties = [],
  propsLoading = false,
  propsError = null,
  refetchProperties = () => {},
}) {
  const [openMenuId, setOpenMenuId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedIds, setExpandedIds] = useState(() => new Set()) // multiple rows can be open

  // Click-away to close the menu
  useEffect(() => {
    const handleAway = () => setOpenMenuId(null)
    document.addEventListener('pointerdown', handleAway)
    return () => document.removeEventListener('pointerdown', handleAway)
  }, [])

  const list = useMemo(() => properties || [], [properties])

  function toggleMenu(id, e) {
    e?.stopPropagation?.()
    setOpenMenuId(v => (v === id ? null : id))
  }
  function stop(e) { e.stopPropagation() }

  function toggleExpand(id) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ----- Actions -----
  function onView(p) {
    alert(`View (coming soon):\n\n${p.name || 'Property'}\n${p.address || ''}`)
    setOpenMenuId(null)
  }

  async function onEdit(p) {
    const newName = window.prompt('Property name:', p.name || '')
    if (newName == null) return
    const newAddress = window.prompt('Address:', p.address || '')
    if (newAddress == null) return
    const newType = window.prompt('Type:', p.type || 'Multi-Family') || 'Multi-Family'
    const newUnits = Number(window.prompt('Units:', String(p.units_count ?? 0)) || '0')

    try {
      setSaving(true)
      const payload = {
        name: newName.trim(),
        address: newAddress.trim(),
        type: newType.trim(),
        units_count: isNaN(newUnits) ? 0 : newUnits,
      }
      const { error } = await supabase.from('properties').update(payload).eq('id', p.id)
      if (error) throw error
      await refetchProperties()
    } catch (e) {
      alert(e.message || 'Save failed')
    } finally { setSaving(false); setOpenMenuId(null) }
  }

  async function onMakeInactive(p) {
    try {
      setSaving(true)
      const hasStatus = 'status' in p
      const update = hasStatus ? { status: 'Inactive' } : { is_active: false }
      const { error } = await supabase.from('properties').update(update).eq('id', p.id)
      if (error) throw error
      await refetchProperties()
    } catch (e) {
      alert(e.message || 'Failed to update status')
    } finally { setSaving(false); setOpenMenuId(null) }
  }

  async function onDelete(p) {
    if (!confirm(`Delete "${p.name || 'this property'}"? This cannot be undone.`)) return
    try {
      setSaving(true)
      const { error } = await supabase.from('properties').delete().eq('id', p.id)
      if (error) throw error
      await refetchProperties()
    } catch (e) {
      alert(e.message || 'Delete failed')
    } finally { setSaving(false); setOpenMenuId(null) }
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <h1 style={title}>Properties</h1>

      {/* Header strip for columns — aligned with the cards */}
      <div style={headerStrip}>
        <div style={headerRow}>
          <div style={{ ...hCellL }}>Property</div>
          <div style={{ ...hCellC }}>Type</div>
          <div style={{ ...hCellC }}>Units</div>
          <div style={{ ...hCellC }}>Status</div>
          <div style={hCellAction} />
        </div>
      </div>

      {propsLoading ? (
        <div style={emptyState}>Loading…</div>
      ) : propsError ? (
        <div style={errorState}>{propsError}</div>
      ) : list.length === 0 ? (
        <div style={emptyState}>No properties yet.</div>
      ) : (
        <div style={cardsWrap}>
          {list.map(p => {
            const inactive =
              (typeof p.status === 'string' && p.status.toLowerCase() === 'inactive') ||
              (typeof p.is_active === 'boolean' && !p.is_active)
            const isOpen = expandedIds.has(p.id)

            return (
              <div key={p.id}>
                {/* Card row */}
                <div
                  style={{ ...cardRow, ...(isOpen ? cardRowOpen : null) }}
                  onPointerDown={() => toggleExpand(p.id)}
                >
                  {/* Grid inside the card */}
                  <div style={cardGrid}>
                    {/* col-1: Property */}
                    <div style={cCellL}>
                      <div style={name}>{p.name || '—'}</div>
                      {p.address ? <div style={address}>{p.address}</div> : null}
                    </div>

                    {/* col-2: Type */}
                    <div style={cCellC}>{p.type || 'Multi-Family'}</div>

                    {/* col-3: Units */}
                    <div style={cCellC}>{(p.units_count ?? 0)} Units</div>

                    {/* col-4: Status */}
                    <div style={cCellC}>
                      {inactive ? <span style={badgeInactive}>Inactive</span> : <span style={{ color:'#64748b' }}>—</span>}
                    </div>

                    {/* col-5: Action menu */}
                    <div style={cCellAction} onPointerDown={stop}>
                      <div style={menuWrap}>
                        <button
                          aria-label="Open menu"
                          style={menuBtn}
                          onPointerDown={(e) => toggleMenu(p.id, e)}
                        >
                          ⋯
                        </button>
                        {openMenuId === p.id && (
                          <div style={menu} onPointerDown={stop}>
                            <div style={item} onClick={() => onView(p)}>View</div>
                            <div style={item} onClick={() => onEdit(p)}>Edit</div>
                            <div style={{ ...item, color:'#dc2626' }} onClick={() => onMakeInactive(p)}>Make inactive</div>
                            <div style={{ ...item, color:'#dc2626' }} onClick={() => onDelete(p)}>Delete</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded area */}
                {isOpen && (
                  <div style={expandBox} onPointerDown={stop}>
                    <div style={expandGrid}>
                      <div><b>Address:</b> {p.address || '—'}</div>
                      <div><b>Type:</b> {p.type || 'Multi-Family'}</div>
                      <div><b>Units:</b> {(p.units_count ?? 0)}</div>
                      <div>
                        <b>Status:</b>{' '}
                        {inactive ? 'Inactive' : '—'}
                      </div>
                    </div>
                    <div style={expandHint}>Full property “View” page coming soon</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {saving && <div style={savingBadge}>Saving…</div>}
    </div>
  )
}

/* ================== Styles ================== */

const title = { margin:'0 0 16px 0' }

/** Shared grid (kept aligned with header) */
const GRID = '1.7fr 1fr 0.9fr 0.9fr 56px'
const PAD = '14px 20px'

/* Header strip */
const headerStrip = {
  marginBottom: 8,
}
const headerRow = {
  display:'grid',
  gridTemplateColumns: GRID,
  alignItems:'center',
  fontSize:12,
  color:'#64748b',
  padding: '0 8px',
}
const hCellL = { padding: '0 20px', textAlign:'left' }
const hCellC = { padding: '0 20px', textAlign:'center' }
const hCellAction = { padding: '0 12px' }

/* Cards list wrap */
const cardsWrap = {
  display:'grid',
  gap: 12, // space between rows/cards
}

/* Card row (DoorLoop-style) */
const cardRow = {
  background:'#fff',
  border:'1px solid #e5e7eb',
  borderRadius:16,
  boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
  cursor:'pointer',
  transition:'box-shadow .15s ease, transform .08s ease',
}
const cardRowOpen = {
  boxShadow:'0 6px 18px rgba(0,0,0,0.08)',
}

/* The internal grid inside each card */
const cardGrid = {
  display:'grid',
  gridTemplateColumns: GRID,
  alignItems:'center',
}

/* Card cells (padding lives on the cell, not the row) */
const cCellL = { padding: PAD }
const cCellC = { padding: PAD, textAlign:'center', whiteSpace:'nowrap', color:'#475569', fontSize:14 }
const cCellAction = { padding: PAD, display:'flex', justifyContent:'flex-end', position:'relative' }

const name = { fontWeight:600, fontSize:16, color:'#0f172a' }
const address = { fontSize:12, color:'#64748b', marginTop:3 }

const badgeInactive = {
  background:'#fee2e2',
  color:'#dc2626',
  padding:'3px 10px',
  borderRadius:12,
  fontSize:12,
  fontWeight:600,
  whiteSpace:'nowrap',
  display:'inline-block',
}

/* Expanded content */
const expandBox = {
  marginTop: 8,
  marginBottom: 2,
  background:'#f8fafc',
  border:'1px dashed #e5e7eb',
  borderRadius:14,
  padding:'14px 16px',
}
const expandGrid = {
  display:'grid',
  gridTemplateColumns:'repeat(4, minmax(0, 1fr))',
  gap:12,
  fontSize:14,
  color:'#374151',
}
const expandHint = { marginTop:8, fontSize:12, color:'#64748b' }

/* Menu */
const menuWrap = { position:'relative' }
const menuBtn = { border:0, background:'none', fontSize:22, cursor:'pointer', borderRadius:6, padding:'2px 8px' }
const menu = {
  position:'absolute',
  right:0,
  top:32,
  width:200,
  background:'#fff',
  border:'1px solid #e2e8f0',
  borderRadius:8,
  boxShadow:'0 8px 18px rgba(0,0,0,0.12)',
  zIndex:50,
  maxHeight:260,
  overflowY:'auto'
}
const item = { padding:'10px 14px', cursor:'pointer', fontSize:14, whiteSpace:'nowrap' }

/* States */
const emptyState = { padding:'18px', color:'#64748b', textAlign:'center' }
const errorState = { padding:'18px', color:'#b91c1c', textAlign:'center' }
const savingBadge = {
  position:'fixed',
  right:16,
  bottom:16,
  background:'#111827',
  color:'#fff',
  padding:'8px 12px',
  borderRadius:8,
  fontSize:12
}
