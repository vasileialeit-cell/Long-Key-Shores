// src/pages/TenantPortal.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import Card from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { Field, Muted } from '../components/FormBits'

const ui = {
  sidebar: { background: '#0f172a', color: '#e2e8f0', padding: 18, position: 'sticky', top: 0, alignSelf: 'start', height: '100vh', minWidth: 260 },
  brand: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 17, marginBottom: 8 },
  role: { fontSize: 12, color: '#94a3b8', marginBottom: 10 },
  nav: { display: 'grid', gap: 8 },
  link: (active) => ({
    padding: '10px 12px',
    borderRadius: 12,
    color: active ? '#e2e8f0' : '#cbd5e1',
    background: active ? '#0b1220' : 'transparent',
    border: `1px solid ${active ? '#1f2a44' : 'transparent'}`,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  }),
  dot: { width: 8, height: 8, borderRadius: 10, background: '#38bdf8' },

  main: { flex: 1, background: '#f8fafc', padding: 24 },
  row: { display: 'grid', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 },
  stat: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, background: '#fff' },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  statValue: { fontWeight: 700, fontSize: 18 },
  btn: { background: '#2563eb', color:'#fff', border:0, borderRadius:10, padding:'10px 14px', fontWeight:600, cursor:'pointer' },
  dangerBtn: { background:'#ef4444', color:'#fff', border:0, borderRadius:10, padding:'8px 12px', fontWeight:600, cursor:'pointer' },
  secondaryBtn: { background:'#f1f5f9', color:'#0f172a', border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 12px', fontWeight:600, cursor:'pointer' },
  input: { width:'100%', border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 12px' },
  imgThumb: { width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }
}

async function fetchTenantBundle() {
  const { data: trows, error: terr } = await supabase
    .from('tenants')
    .select(`
      id,
      app_users(id,name,email),
      leases (
        id, monthly_rent, start_date, end_date, due_day,
        properties ( id, name, address )
      )
    `)
    .limit(1)
  if (terr) throw terr
  const tenant = trows?.[0] || null
  const lease = tenant?.leases?.[0] || null
  return { tenant, lease }
}

function deriveLeaseStatus(lease) {
  if (!lease?.start_date || !lease?.end_date) return '—'
  const now = new Date()
  const start = new Date(lease.start_date)
  const end = new Date(lease.end_date)
  if (now < start) return 'Upcoming'
  if (now > end) return 'Ended'
  return 'Active'
}

async function getSignedUrl(path) {
  if (!path) return null
  try {
    const { data, error } = await supabase.storage.from('lks-docs').createSignedUrl(path, 3600)
    if (error) return null
    return data?.signedUrl || null
  } catch { return null }
}

export default function TenantPortal() {
  const [tab, setTab] = useState('home')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tenant, setTenant] = useState(null)
  const [lease, setLease] = useState(null)

  const [reqs, setReqs] = useState([])
  const [signedUrls, setSignedUrls] = useState({})
  const [mOpen, setMOpen] = useState(false)
  const [mForm, setMForm] = useState({ title:'', priority:'Medium' })
  const [mFile, setMFile] = useState(null)
  const [busy, setBusy] = useState(false)

  const [files, setFiles] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setError('')
        const { tenant, lease } = await fetchTenantBundle()
        if (!alive) return
        setTenant(tenant); setLease(lease)

        if (tenant?.id) {
          const { data: m, error: me } = await supabase
            .from('maintenance_requests')
            .select('id,title,priority,status,created_at,property_id,tenant_id,photo_path')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false })
          if (me) throw me
          setReqs(m || [])
          const map = {}
          for (const r of m || []) {
            if (r.photo_path) map[r.id] = await getSignedUrl(r.photo_path)
          }
          setSignedUrls(map)
        }

        if (tenant?.id) {
          let combined = []
          const { data: d1 } = await supabase
            .from('documents')
            .select('id,title,url,created_at,tenant_id,lease_id')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false })
          if (d1) combined = combined.concat(d1)
          if (lease?.id) {
            const { data: d2 } = await supabase
              .from('documents')
              .select('id,title,url,created_at,tenant_id,lease_id')
              .eq('lease_id', lease.id)
              .order('created_at', { ascending: false })
            if (d2) combined = combined.concat(d2)
          }
          setFiles(combined)
        }
      } catch (e) {
        if (!alive) return
        setError(e.message || 'Failed to load tenant portal')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const nextDueDate = useMemo(() => {
    if (!lease?.due_day) return null
    const now = new Date()
    const y = now.getMonth() === 11 ? now.getFullYear()+1 : now.getFullYear()
    const m = now.getMonth() === 11 ? 0 : now.getMonth()+1
    const d = Number(lease.due_day) || 1
    return new Date(y, m, d)
  }, [lease?.due_day])

  async function createRequest() {
    if (!tenant?.id || !lease?.properties?.id) return alert('Missing lease or tenant.')
    if (!mForm.title.trim()) return alert('Please enter a title/description')
    try {
      setBusy(true)

      const basePayload = {
        title: mForm.title.trim(),
        priority: mForm.priority || 'Medium',
        status: 'Open',
        tenant_id: tenant.id,
        property_id: lease.properties.id
      }
      const { data: inserted, error: insErr } = await supabase
        .from('maintenance_requests')
        .insert(basePayload, { returning: 'minimal' }) // prevent RETURNING read
      if (insErr) throw insErr

      // upload photo if any (best-effort)
      if (mFile) {
        // Fetch the last inserted id by reloading (since returning is minimal)
        const { data: latest } = await supabase
          .from('maintenance_requests')
          .select('id')
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false })
          .limit(1)
        const newId = latest?.[0]?.id

        if (newId) {
          const safeName = mFile.name?.replace(/\s+/g, '_') || `photo-${Date.now()}.jpg`
          const storagePath = `maintenance/${newId}-${safeName}`
          const { error: upErr } = await supabase.storage.from('lks-docs').upload(storagePath, mFile, { cacheControl: '3600', upsert: true })
          if (!upErr) {
            await supabase.from('maintenance_requests').update({ photo_path: storagePath }).eq('id', newId)
          }
        }
      }

      // refresh list
      const { data } = await supabase
        .from('maintenance_requests')
        .select('id,title,priority,status,created_at,property_id,tenant_id,photo_path')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
      setReqs(data || [])

      // refresh thumbnails
      const map = {}
      for (const r of data || []) {
        if (r.photo_path) map[r.id] = await getSignedUrl(r.photo_path)
      }
      setSignedUrls(map)

      setMOpen(false)
      setMForm({ title:'', priority:'Medium' }); setMFile(null)
    } catch (e) {
      alert(e.message || 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  async function deleteRequest(req) {
    if (!window.confirm('Delete this maintenance request?')) return
    try {
      // try to delete the DB row first
      const { error } = await supabase.from('maintenance_requests').delete().eq('id', req.id)
      if (error) throw error

      // best-effort: try to remove the file (may fail if storage policy disallows)
      if (req.photo_path) {
        try { await supabase.storage.from('lks-docs').remove([req.photo_path]) } catch {}
      }

      // refresh
      const { data } = await supabase
        .from('maintenance_requests')
        .select('id,title,priority,status,created_at,property_id,tenant_id,photo_path')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
      setReqs(data || [])
      const map = {}
      for (const r of data || []) {
        if (r.photo_path) map[r.id] = await getSignedUrl(r.photo_path)
      }
      setSignedUrls(map)
    } catch (e) {
      alert(e.message || 'Could not delete')
    }
  }

  const NavLink = ({ id, label }) => (
    <div style={ui.link(tab === id)} onClick={() => setTab(id)}>
      <span>{label}</span>{tab === id ? <span style={ui.dot}/> : <span/>}
    </div>
  )

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      {/* SIDEBAR */}
      <aside style={ui.sidebar}>
        <div style={ui.brand}><span>🏠</span><span>Tenant Portal</span></div>
        <div style={ui.role}>Signed in as tenant</div>
        <div style={ui.nav}>
          <NavLink id="home" label="Home" />
          <NavLink id="maintenance" label="Maintenance" />
          <NavLink id="files" label="Files" />
          <NavLink id="payments" label="Payments" />
        </div>
      </aside>

      {/* CONTENT */}
      <main style={ui.main}>
        {loading ? (
          <Muted>Loading…</Muted>
        ) : error ? (
          <div style={{ color:'#b91c1c' }}>{error}</div>
        ) : (
          <>
            {tab === 'home' && (
              <div style={ui.row}>
                <Card title="Lease">
                  {lease ? (
                    <Table
                      head={['Property','Monthly Rent','Due','Status']}
                      rows={[
                        [
                          lease.properties?.name || '—',
                          lease.monthly_rent != null ? `$${Number(lease.monthly_rent).toLocaleString()}` : '—',
                          lease.due_day ? `Due on ${lease.due_day}` : '—',
                          deriveLeaseStatus(lease),
                        ]
                      ]}
                    />
                  ) : <Muted>No active lease found.</Muted>}
                  {lease?.properties?.address && (
                    <div style={{ marginTop: 12 }}><b>Address:</b> {lease.properties.address}</div>
                  )}
                </Card>

                <Card title="Next Rent">
                  {lease ? (
                    <div style={ui.grid3}>
                      <div style={ui.stat}>
                        <div style={ui.statLabel}>Amount</div>
                        <div style={ui.statValue}>
                          {lease.monthly_rent != null ? `$${Number(lease.monthly_rent).toLocaleString()}` : '—'}
                        </div>
                      </div>
                      <div style={ui.stat}>
                        <div style={ui.statLabel}>Due Day</div>
                        <div style={ui.statValue}>{lease.due_day || '—'}</div>
                      </div>
                      <div style={ui.stat}>
                        <div style={ui.statLabel}>Next Due</div>
                        <div style={ui.statValue}>{nextDueDate ? nextDueDate.toLocaleDateString() : '—'}</div>
                      </div>
                    </div>
                  ) : <Muted>No rent due.</Muted>}
                  <div style={{ marginTop: 10, color:'#64748b' }}>
                    Online payments coming soon — you’ll be able to pay here.
                  </div>
                </Card>
              </div>
            )}

            {tab === 'maintenance' && (
              <div style={ui.row}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <h2 style={{ margin:0 }}>Maintenance Requests</h2>
                  <button style={ui.btn} onClick={() => setMOpen(true)}>+ New Request</button>
                </div>
                <Card>
                  {reqs?.length ? (
                    <Table
                      head={['', 'Title','Priority','Status','Created','Actions']}
                      rows={reqs.map(r => [
                        r.photo_path && signedUrls[r.id]
                          ? <a key={`img-${r.id}`} href={signedUrls[r.id]} target="_blank" rel="noreferrer">
                              <img src={signedUrls[r.id]} alt="" style={ui.imgThumb}/>
                            </a>
                          : <div style={{ width:48 }} />,
                        r.title,
                        r.priority || '—',
                        r.status || '—',
                        new Date(r.created_at).toLocaleString(),
                        <button key={`del-${r.id}`} style={ui.dangerBtn} onClick={() => deleteRequest(r)}>Delete</button>
                      ])}
                    />
                  ) : <Muted>No requests yet.</Muted>}
                </Card>

                <Modal title="New Maintenance Request" open={mOpen} onClose={() => setMOpen(false)}>
                  <div style={{ display:'grid', gap:12 }}>
                    <Field label="Title / Description">
                      <textarea
                        style={{ ...ui.input, minHeight: 90 }}
                        value={mForm.title}
                        onChange={e => setMForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Describe the issue…"
                      />
                    </Field>
                    <Field label="Priority">
                      <select style={ui.input} value={mForm.priority} onChange={e => setMForm(f => ({ ...f, priority: e.target.value }))}>
                        <option>Low</option><option>Medium</option><option>High</option>
                      </select>
                    </Field>
                    <Field label="Photo (optional)">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => setMFile(e.target.files?.[0] || null)}
                        style={ui.input}
                      />
                      <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>
                        JPG/PNG recommended. You can add one photo for now.
                      </div>
                    </Field>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:12 }}>
                    <button style={ui.secondaryBtn} onClick={() => setMOpen(false)}>Cancel</button>
                    <button style={ui.btn} disabled={busy} onClick={createRequest}>
                      {busy ? 'Saving…' : 'Submit'}
                    </button>
                  </div>
                </Modal>
              </div>
            )}

            {tab === 'files' && (
              <div style={ui.row}>
                <Card title="My Files">
                  {files?.length ? (
                    <Table
                      head={['Title','Added','Action']}
                      rows={files.map(f => [
                        f.title || 'File',
                        new Date(f.created_at).toLocaleString(),
                        <a key={f.id} href={f.url} target="_blank" rel="noreferrer" style={{ color:'#2563eb', fontWeight:600 }}>View</a>
                      ])}
                    />
                  ) : <Muted>No files yet.</Muted>}
                </Card>
              </div>
            )}

            {tab === 'payments' && (
              <div style={ui.row}>
                <Card title="Payments">
                  {lease ? (
                    <>
                      <div style={{ marginBottom: 12, color:'#64748b' }}>
                        Your monthly rent is{' '}
                        <b>{lease.monthly_rent != null ? `$${Number(lease.monthly_rent).toLocaleString()}` : '—'}</b>{' '}
                        and is due on day <b>{lease.due_day || '—'}</b> of each month.
                      </div>
                      <button style={ui.btn} disabled title="Coming soon">
                        Pay Rent (coming soon)
                      </button>
                    </>
                  ) : <Muted>No active lease to pay.</Muted>}
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
