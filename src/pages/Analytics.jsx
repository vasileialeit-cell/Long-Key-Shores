// src/pages/Analytics.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { container, pageTitle, emptyState, errorState, cardsWrap, cardRow } from '../ui'

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    properties: 0, tenants: 0, leases: 0, openMaint: 0, mrr: 0
  })
  const [rentByProperty, setRentByProperty] = useState([]) // [{name,total}]
  const [overdueRent, setOverdueRent] = useState([])       // leases overdue this month
  const [upcomingRent, setUpcomingRent] = useState([])     // leases due in next 14 days
  const [maintStatus, setMaintStatus] = useState({ open: 0, inProgress: 0, completed: 0 })
  const [openAges, setOpenAges] = useState([])             // [{title, daysOpen, property, tenant}]

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setError('')

        // --- KPI counts ---
        const [{ count: properties }, { count: tenants }, { count: leases }, { count: openMaint }] =
          await Promise.all([
            supabase.from('properties').select('id', { count:'exact', head:true }),
            supabase.from('tenants').select('id', { count:'exact', head:true }),
            supabase.from('leases').select('id', { count:'exact', head:true }),
            supabase.from('maintenance_requests').select('id', { count:'exact', head:true }).eq('status', 'Open'),
          ])

        // --- Leases for finance slices ---
        const { data: leaseRows, error: lerr } = await supabase
          .from('leases')
          .select(`
            id, monthly_rent, due_day, start_date, end_date,
            properties ( name ),
            tenants ( app_users ( name ) )
          `)
        if (lerr) throw lerr

        // MRR & rent by property
        const totals = {}
        let mrr = 0
        for (const r of leaseRows || []) {
          const amt = Number(r.monthly_rent) || 0
          const pname = r.properties?.name || 'Unknown'
          totals[pname] = (totals[pname] || 0) + amt
          mrr += amt
        }
        const byProp = Object.entries(totals)
          .map(([name, total]) => ({ name, total }))
          .sort((a,b)=>b.total - a.total)

        // Overdue & Upcoming (based on due_day within this month)
        const now = new Date()
        const today = now.getDate()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
        const inNext = (days) => {
          // e.g. next 14 days across month boundary
          const target = today + days
          return (d) => {
            if (d >= today) return d <= Math.min(daysInMonth, target)
            // if due_day already passed, consider next month window
            return (d + daysInMonth) <= target
          }
        }
        const next14 = inNext(14)

        const overdue = []
        const upcoming = []
        for (const r of leaseRows || []) {
          const d = Number(r.due_day)
          if (!d) continue
          const dueHasPassed = d < today
          if (dueHasPassed) {
            overdue.push({
              id: r.id,
              tenant: r.tenants?.app_users?.name || '—',
              property: r.properties?.name || '—',
              dueDay: d,
              amount: Number(r.monthly_rent) || 0
            })
          } else if (next14(d)) {
            upcoming.push({
              id: r.id,
              tenant: r.tenants?.app_users?.name || '—',
              property: r.properties?.name || '—',
              dueDay: d,
              amount: Number(r.monthly_rent) || 0
            })
          }
        }
        overdue.sort((a,b)=>a.dueDay - b.dueDay)
        upcoming.sort((a,b)=>a.dueDay - b.dueDay)

        // --- Maintenance breakdown and open ages ---
        const { data: maintRows } = await supabase
          .from('maintenance_requests')
          .select(`id, title, status, created_at, properties(name), tenants(app_users(name))`)

        let open = 0, inProg = 0, comp = 0
        const ages = []
        for (const m of maintRows || []) {
          const st = (m.status || 'Open').toLowerCase()
          if (st === 'open') open++
          else if (st === 'in progress') inProg++
          else if (st === 'completed') comp++

          if (st === 'open') {
            const created = new Date(m.created_at)
            const daysOpen = Math.max(0, Math.round((now - created) / (1000*60*60*24)))
            ages.push({
              title: m.title || '—',
              daysOpen,
              property: m.properties?.name || '—',
              tenant: m.tenants?.app_users?.name || '—'
            })
          }
        }
        ages.sort((a,b)=>b.daysOpen - a.daysOpen)

        if (!alive) return
        setStats({
          properties: properties ?? 0,
          tenants: tenants ?? 0,
          leases: leases ?? 0,
          openMaint: openMaint ?? 0,
          mrr
        })
        setRentByProperty(byProp)
        setOverdueRent(overdue)
        setUpcomingRent(upcoming)
        setMaintStatus({ open, inProgress: inProg, completed: comp })
        setOpenAges(ages)
      } catch (e) {
        if (!alive) return
        setError(e.message || 'Failed to load analytics')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // simple rows
  const row = (left, right) => (
    <div style={{
      display:'grid', gridTemplateColumns:'1fr auto',
      padding:'8px 0', borderBottom:'1px solid #eef2f7', alignItems:'center'
    }}>
      <div>{left}</div>
      <div style={{ fontWeight:700 }}>{right}</div>
    </div>
  )

  const Section = ({ title, children }) => (
    <div style={{
      background:'#fff', border:'1px solid #e5e7eb', borderRadius:14,
      padding:'12px 14px', boxShadow:'0 1px 2px rgba(0,0,0,0.03)'
    }}>
      <div style={{ fontWeight:800, fontSize:16, marginBottom:8 }}>{title}</div>
      {children}
    </div>
  )

  const Tile = ({ label, value }) => (
    <div style={{
      background:'#fff', border:'1px solid #e5e7eb', borderRadius:14,
      padding:'16px 18px', display:'grid', gap:6, boxShadow:'0 1px 2px rgba(0,0,0,0.03)'
    }}>
      <div style={{ fontSize:13, color:'#64748b', fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:800 }}>{value}</div>
    </div>
  )

  const money = (n) => `$${Number(n || 0).toLocaleString()}`

  const overdueTotal = useMemo(
    () => overdueRent.reduce((a,b)=>a + (b.amount||0), 0), [overdueRent]
  )
  const upcomingTotal = useMemo(
    () => upcomingRent.reduce((a,b)=>a + (b.amount||0), 0), [upcomingRent]
  )

  return (
    <div style={container}>
      <h1 style={pageTitle}>Analytics</h1>

      {loading ? (
        <div style={emptyState}>Loading…</div>
      ) : error ? (
        <div style={errorState}>{error}</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0,1fr))', gap:14, marginBottom:14 }}>
            <Tile label="Properties" value={stats.properties} />
            <Tile label="Tenants" value={stats.tenants} />
            <Tile label="Leases" value={stats.leases} />
            <Tile label="Open Maint." value={stats.openMaint} />
            <Tile label="Monthly Rent (MRR)" value={money(stats.mrr)} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1.15fr 0.85fr', gap:14 }}>
            {/* Left column */}
            <div style={{ display:'grid', gap:14 }}>
              <Section title="Overdue Rent (this month)">
                {overdueRent.length ? (
                  <>
                    {overdueRent.map(o => row(
                      <div>
                        <div style={{ fontWeight:700 }}>{o.tenant}</div>
                        <div style={{ fontSize:12, color:'#64748b' }}>{o.property} · Due day {o.dueDay}</div>
                      </div>,
                      money(o.amount)
                    ))}
                    {row(<div style={{ fontWeight:800 }}>Total</div>, money(overdueTotal))}
                  </>
                ) : <div style={emptyState}>No overdue rent 🎉</div>}
              </Section>

              <Section title="Open Maintenance — Age (days)">
                {openAges.length ? (
                  openAges.map(a => row(
                    <div>
                      <div style={{ fontWeight:700 }}>{a.title}</div>
                      <div style={{ fontSize:12, color:'#64748b' }}>{a.tenant} · {a.property}</div>
                    </div>,
                    `${a.daysOpen}d`
                  ))
                ) : <div style={emptyState}>No open requests.</div>}
              </Section>
            </div>

            {/* Right column */}
            <div style={{ display:'grid', gap:14 }}>
              <Section title="Upcoming Rent (next 14 days)">
                {upcomingRent.length ? (
                  <>
                    {upcomingRent.map(u => row(
                      <div>
                        <div style={{ fontWeight:700 }}>{u.tenant}</div>
                        <div style={{ fontSize:12, color:'#64748b' }}>{u.property} · Due day {u.dueDay}</div>
                      </div>,
                      money(u.amount)
                    ))}
                    {row(<div style={{ fontWeight:800 }}>Total</div>, money(upcomingTotal))}
                  </>
                ) : <div style={emptyState}>No upcoming rent in 14 days.</div>}
              </Section>

              <Section title="Maintenance Status">
                {row('Open', stats.openMaint)}
                {row('In Progress', maintStatus.inProgress)}
                {row('Completed', maintStatus.completed)}
              </Section>

              <Section title="Rent by Property (snapshot)">
                {rentByProperty.length ? (
                  rentByProperty.map(r => row(r.name, money(r.total)))
                ) : <div style={emptyState}>No revenue yet.</div>}
              </Section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
