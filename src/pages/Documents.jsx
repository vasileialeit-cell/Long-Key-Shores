// src/pages/Documents.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

/* ------------------------------ Vee style ------------------------------ */
const container = { maxWidth: 1100, margin: '0 auto', padding: '28px 22px 80px' }
const pageTitle = { fontSize: 40, fontWeight: 800, letterSpacing: 0.2, margin: '10px 0 22px' }

// 4 columns now: Title | Uploaded By | Uploaded Date | menu
const GRID = '1.6fr 1fr 1fr 80px'

const headerStrip = {
  display: 'grid',
  gridTemplateColumns: GRID,
  fontSize: 14,
  color: '#667085',
  padding: '10px 14px',
  marginTop: 6,
}
const cardsWrap = { display: 'grid', gap: 14, marginTop: 10 }

const cardRow = {
  display: 'grid',
  gridTemplateColumns: GRID,
  alignItems: 'center',
  background: '#fff',
  borderRadius: 16,
  padding: '14px 14px',
  boxShadow: '0 1px 0 1px rgba(17,24,39,0.03), 0 10px 24px rgba(17,24,39,0.06)',
}

const name = { fontSize: 20, fontWeight: 700, color: '#101828' }
// (subline removed per request)

const right = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }
const btnPrimary = {
  background: '#1d4ed8', color: '#fff', fontWeight: 600, border: 0, borderRadius: 12, padding: '10px 16px', cursor: 'pointer'
}

const menuWrap = { position: 'relative' }
const menuBtn = {
  width: 36, height: 36, display: 'grid', placeItems: 'center',
  borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer'
}
const menu = {
  position: 'absolute', right: 0, top: 44, background: '#fff', borderRadius: 12,
  boxShadow: '0 12px 28px rgba(17,24,39,.14), 0 1px 0 1px rgba(17,24,39,.04)',
  overflow: 'hidden', minWidth: 180, zIndex: 30,
}
const menuItem = { padding: '10px 14px', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }
const emptyState = {
  background: '#fff', borderRadius: 16, padding: 24, color: '#64748b', textAlign: 'center',
  boxShadow: '0 1px 0 1px rgba(17,24,39,0.03), 0 10px 24px rgba(17,24,39,0.06)',
}

function Modal({ open, title, children, onClose, width = 920 }) {
  if (!open) return null
  return (
    <div
      onPointerDown={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,.45)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }}
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ background: '#fff', width: '100%', maxWidth: width, borderRadius: 18, boxShadow: '0 24px 60px rgba(2,6,23,.35)', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #eef2f7' }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ border: 0, background: '#f3f4f6', padding: '6px 10px', borderRadius: 10, cursor: 'pointer' }}>Close</button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  )
}
/* ---------------------------------------------------------------------- */

const BUCKET = 'lks-docs' // storage bucket

function kindFrom(doc) {
  const mt = doc.mime_type || ''
  const url = (doc.url || '').toLowerCase()
  if (mt.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(url)) return 'image'
  if (mt === 'application/pdf' || /\.pdf$/.test(url)) return 'pdf'
  return 'other'
}

export default function Documents() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuId, setMenuId] = useState(null)

  // Add modal
  const [openAdd, setOpenAdd] = useState(false)
  const [addMode, setAddMode] = useState('upload') // 'upload' | 'link'
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [linkUrl, setLinkUrl] = useState('')

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editDoc, setEditDoc] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  // Preview modal
  const [preview, setPreview] = useState(null) // { url, title, kind }

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
        // NOTE: no size_bytes; user info not joined (showing "—" for now)
        const { data, error } = await supabase
          .from('documents')
          .select('id, title, url, path, mime_type, created_at')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (!alive) return
        setRows(data || [])
      } catch (e) {
        if (!alive) return
        setError(e.message || 'Failed to load documents')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const list = useMemo(() => rows || [], [rows])

  async function signedUrlFor(path) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
    if (error) throw error
    return data?.signedUrl || ''
  }

  async function onView(doc) {
    try {
      let url = doc.url || ''
      if (doc.path) url = await signedUrlFor(doc.path)
      if (!url) throw new Error('No URL available for this document.')
      const kind = kindFrom(doc)
      if (kind === 'image' || kind === 'pdf') {
        setPreview({ url, title: doc.title, kind })
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch (e) {
      alert(e.message || 'Could not open document')
    } finally {
      setMenuId(null)
    }
  }

  async function onDownload(doc) {
    try {
      let url = doc.url || ''
      if (doc.path) url = await signedUrlFor(doc.path)
      if (!url) throw new Error('No URL to download')
      const a = document.createElement('a')
      a.href = url
      a.download = doc.title || 'document'
      document.body.appendChild(a); a.click(); a.remove()
    } catch (e) {
      alert(e.message || 'Download failed')
    } finally {
      setMenuId(null)
    }
  }

  function openEditModal(doc) {
    setEditDoc(doc)
    setEditTitle(doc.title || '')
    setEditOpen(true)
    setMenuId(null)
  }

  async function saveEdit() {
    try {
      if (!editDoc) return
      const { error } = await supabase.from('documents').update({ title: editTitle }).eq('id', editDoc.id)
      if (error) throw error
      setRows(prev => prev.map(d => d.id === editDoc.id ? { ...d, title: editTitle } : d))
      setEditOpen(false)
    } catch (e) {
      alert(e.message || 'Update failed')
    }
  }

  async function onDelete(doc) {
    if (!confirm('Delete this document?')) return
    try {
      if (doc.path) {
        await supabase.storage.from(BUCKET).remove([doc.path])
      }
      const { error } = await supabase.from('documents').delete().eq('id', doc.id)
      if (error) throw error
      setRows(prev => prev.filter(d => d.id !== doc.id))
    } catch (e) {
      alert(e.message || 'Delete failed')
    } finally {
      setMenuId(null)
    }
  }

  function resetAdd() {
    setTitle(''); setFile(null); setLinkUrl(''); setAddMode('upload')
  }

  async function saveAdd() {
    try {
      if (!title.trim()) throw new Error('Please enter a title')

      let payload = { title }

      if (addMode === 'upload') {
        if (!file) throw new Error('Choose a file to upload')
        const path = `${crypto.randomUUID()}/${file.name}`
        const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: '3600', upsert: false,
        })
        if (error) throw error
        payload.path = data.path
        payload.mime_type = file.type || null
      } else {
        if (!linkUrl.trim()) throw new Error('Paste a URL')
        payload.url = linkUrl.trim()
        if (/\.(pdf)$/i.test(payload.url)) payload.mime_type = 'application/pdf'
      }

      const { data: ins, error: insErr } = await supabase
        .from('documents')
        .insert(payload)
        .select('id, title, url, path, mime_type, created_at')
        .single()
      if (insErr) throw insErr

      setRows(prev => [ins, ...prev])
      setOpenAdd(false)
      resetAdd()
    } catch (e) {
      alert(e.message || 'Could not add document')
    }
  }

  return (
    <div style={container}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={pageTitle}>Documents</h1>
        <button style={btnPrimary} onClick={() => setOpenAdd(true)}>+ Add Document</button>
      </div>

      {/* header */}
      <div style={headerStrip}>
        <div>Title</div>
        <div>Uploaded By</div>
        <div>Uploaded Date</div>
        <div />
      </div>

      {/* list */}
      {loading ? (
        <div style={emptyState}>Loading…</div>
      ) : error ? (
        <div style={emptyState}>Error: {error}</div>
      ) : list.length === 0 ? (
        <div style={emptyState}>No documents yet.</div>
      ) : (
        <div style={cardsWrap}>
          {list.map(doc => (
            <div key={doc.id} style={cardRow}>
              {/* Title only (URL hidden) */}
              <div>
                <div style={name}>{doc.title || '(untitled)'}</div>
              </div>

              {/* Uploaded By – placeholder for now */}
              <div>—</div>

              {/* Date only */}
              <div>{new Date(doc.created_at).toLocaleDateString()}</div>

              {/* Menu */}
              <div style={right}>
                <div style={menuWrap} onPointerDown={(e)=>e.stopPropagation()}>
                  <button style={menuBtn} onClick={()=>setMenuId(id => id===doc.id?null:doc.id)}>⋯</button>
                  {menuId === doc.id && (
                    <div style={menu}>
                      <div style={menuItem} onClick={()=>onView(doc)}>View</div>
                      <div style={menuItem} onClick={()=>openEditModal(doc)}>Edit info</div>
                      <div style={menuItem} onClick={()=>onDownload(doc)}>Download</div>
                      <div style={{...menuItem, color:'#dc2626'}} onClick={()=>onDelete(doc)}>Delete</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal open={openAdd} title="Add Document" onClose={()=>{ setOpenAdd(false); resetAdd() }}>
        <div style={{ display:'grid', gap:14 }}>
          <label style={{ fontWeight:600 }}>Title</label>
          <input
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            placeholder="e.g., Lease Agreement"
            style={{ padding:'12px 14px', border:'1px solid #e5e7eb', borderRadius:12, outline:'none' }}
          />

          <div style={{ display:'flex', gap:10, marginTop:6 }}>
            <button
              onClick={()=>setAddMode('upload')}
              style={{ padding:'8px 12px', borderRadius:10, border:'1px solid #dbe2ea', background: addMode==='upload' ? '#eef2ff' : '#fff', fontWeight:600 }}
            >
              Upload File
            </button>
            <button
              onClick={()=>setAddMode('link')}
              style={{ padding:'8px 12px', borderRadius:10, border:'1px solid #dbe2ea', background: addMode==='link' ? '#eef2ff' : '#fff', fontWeight:600 }}
            >
              Link URL
            </button>
          </div>

          {addMode === 'upload' ? (
            <>
              <label style={{ fontWeight:600, marginTop:8 }}>Choose file</label>
              <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
              <div style={{ color:'#64748b', fontSize:13 }}>Accepted: images, PDF, Word, Excel, text.</div>
            </>
          ) : (
            <>
              <label style={{ fontWeight:600, marginTop:8 }}>URL</label>
              <input
                value={linkUrl}
                onChange={(e)=>setLinkUrl(e.target.value)}
                placeholder="https://…"
                style={{ padding:'12px 14px', border:'1px solid #e5e7eb', borderRadius:12, outline:'none' }}
              />
            </>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:10 }}>
            <button onClick={()=>{ setOpenAdd(false); resetAdd() }} style={{ padding:'10px 14px', borderRadius:12, border:'1px solid #e5e7eb', background:'#fff' }}>Cancel</button>
            <button onClick={saveAdd} style={btnPrimary}>Save</button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={editOpen} title="Edit Info" onClose={()=>setEditOpen(false)} width={520}>
        <div style={{ display:'grid', gap:12 }}>
          <label style={{ fontWeight:600 }}>Title</label>
          <input
            value={editTitle}
            onChange={(e)=>setEditTitle(e.target.value)}
            style={{ padding:'12px 14px', border:'1px solid #e5e7eb', borderRadius:12, outline:'none' }}
          />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button onClick={()=>setEditOpen(false)} style={{ padding:'10px 14px', borderRadius:12, border:'1px solid #e5e7eb', background:'#fff' }}>Cancel</button>
            <button onClick={saveEdit} style={btnPrimary}>Save</button>
          </div>
        </div>
      </Modal>

      {/* Preview modal (image / PDF) */}
      <Modal open={!!preview} title={preview?.title || 'Preview'} onClose={()=>setPreview(null)}>
        {preview?.url ? (
          preview.kind === 'image' ? (
            <div style={{ display:'grid', placeItems:'center' }}>
              <img src={preview.url} alt="preview" style={{ maxWidth:'100%', maxHeight:'75vh', objectFit:'contain', borderRadius:12, background:'#fff' }} />
            </div>
          ) : (
            <iframe
              title="preview"
              src={`${preview.url}#toolbar=1&navpanes=0&zoom=page-width`}
              style={{ width:'100%', height:'75vh', background:'#fff', border:'none', borderRadius:12 }}
            />
          )
        ) : null}
      </Modal>
    </div>
  )
}
