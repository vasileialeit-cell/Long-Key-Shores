// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  container, pageTitle,
  emptyState, errorState,
  cardsWrap, cardRow, cardGrid,
} from '../ui'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [counts, setCounts] = useState({ properties: 0, tenants: 0, leases: 0, openMaint: 0 })
  const [recentMaint, setRecentMaint] = useState([])
  const [upcoming, setUpcoming] = useState([]) // next rent due
  const [latestLeases, setLatestLeases] = useState([])

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setError('')

        // KPI counts
        const [{ count: properties }, { count: tenants }, { count: leases }, { count: openMaint }] =
          await Promise.all([
            supabase.from('properties').select('id', { count:'exact', head:true }),
            supabase.from('tenants').select('id', { count:'exact', head:true }),
            supabase.from('leases').select('id', { count:'exact', head:true }),
            supabase.from('maintenance_requests').select('id', { count:'exact', head:true }).eq('status', 'Open'),
          ])

        // Recent maintenance
        const { data: maint } = await supabase
          .from('maintenance_requests')
          .select(`id, title, status, priority, created_at, properties ( name ), tenants ( app_users ( name ) )`)
          .order('created_at', { ascending: false })
          .limit(5)

        // Upcoming rent due (within ~20 days)
        const { data: rents } = await supabase
          .from('leases')
          .select(`id, monthly_rent, due_day, tenants ( app_users ( name ) ), properties ( name )`)
          .order('due_day', { ascending: true })
          .limit(8)

        // Latest leases
        const { data: leasesData } = await supabase
          .from('leases')
          .select(`id, start_date, end_date, monthly_rent, tenants ( app_users ( name ) ), properties ( name )`)
          .order('start_date', { ascending: false })
          .limit(5)

        if (!alive) return
        setCounts({
          properties: properties ?? 0,
          tenants: tenants ?? 0,
          leases: leases ?? 0,
          openMaint: openMaint ?? 0,
        })
        setRecentMaint(maint || [])
        setUpcoming(rents || [])
        setLatestLeases(leasesData || [])
      } catch (e) {
        if (!alive) return
        setError(e.message || 'Failed to load dashboard')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const Tile = ({ label, value }) => (
    <div style={{
      background:'#fff', border:'1px solid #e5e7eb', borderRadius:14,
      padding:'16px 18px', display:'grid', gap:6, boxShadow:'0 1px 2px rgba(0,0,0,0.03)'
    }}>
      <div style={{ fontSize:13, color:'#64748b', fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:800 }}>{value}</div>
    </div>
  )

  const section = (title, children) => (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'12px 14px', boxShadow:'0 1px 2px rgba(0,0,0,0.03)' }}>
      <div style={{ fontWeight:800, fontSize:16, marginBottom:8 }}>{title}</div>
      {children}
    </div>
  )

  const listRow = (left, right) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #eef2f7' }}>
      <div>{left}</div>
      <div style={{ color:'#475569', fontWeight:700 }}>{right}</div>
    </div>
  )

  return (
    <div style={container}>
      <h1 style={pageTitle}>Dashboard</h1>

      {loading ? (
        <div style={emptyState}>Loading…</div>
      ) : error ? (
        <div style={errorState}>{error}</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:14, marginBottom:14 }}>
            <Tile label="Properties" value={counts.properties} />
            <Tile label="Tenants" value={counts.tenants} />
            <Tile label="Leases" value={counts.leases} />
            <Tile label="Open Maintenance" value={counts.openMaint} />
          </div>

          {/* Two columns of detail */}
          <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:14 }}>
            {section('Recent Maintenance', (
              recentMaint?.length ? (
                <div>
                  {recentMaint.map(m => listRow(
                    <div>
                      <div style={{ fontWeight:700 }}>{m.title}</div>
                      <div style={{ fontSize:12, color:'#64748b' }}>
                        {m.tenants?.app_users?.name || '—'} · {m.properties?.name || '—'} · {m.priority || '—'} · {m.status || '—'}
                      </div>
                    </div>,
                    new Date(m.created_at).toLocaleDateString()
                  ))}
                </div>
              ) : <div style={emptyState}>No activity yet.</div>
            ))}

            {section('Upcoming Rent', (
              upcoming?.length ? (
                <div>
                  {upcoming.map(u => listRow(
                    <div>
                      <div style={{ fontWeight:700 }}>{u.tenants?.app_users?.name || '—'}</div>
                      <div style={{ fontSize:12, color:'#64748b' }}>{u.properties?.name || '—'} · Due day {u.due_day ?? '—'}</div>
                    </div>,
                    u.monthly_rent != null ? `$${Number(u.monthly_rent).toLocaleString()}` : '—'
                  ))}
                </div>
              ) : <div style={emptyState}>No upcoming rent items.</div>
            ))}
          </div>

          <div style={{ marginTop:14 }}>
            {section('Latest Leases', (
              latestLeases?.length ? (
                <div>
                  {latestLeases.map(l => listRow(
                    <div>
                      <div style={{ fontWeight:700 }}>{l.tenants?.app_users?.name || '—'}</div>
                      <div style={{ fontSize:12, color:'#64748b' }}>
                        {l.properties?.name || '—'} · {l.start_date ? new Date(l.start_date).toLocaleDateString() : '—'} — {l.end_date ? new Date(l.end_date).toLocaleDateString() : '—'}
                      </div>
                    </div>,
                    l.monthly_rent != null ? `$${Number(l.monthly_rent).toLocaleString()}` : '—'
                  ))}
                </div>
              ) : <div style={emptyState}>No recent leases.</div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
