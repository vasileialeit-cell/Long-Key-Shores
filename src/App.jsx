// src/App.jsx
import React, { useEffect, useState } from 'react'
import styles from './styles/styles'

// Layout
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

// Owner/Admin pages
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import Tenants from './pages/Tenants'
import Leases from './pages/Leases'
import Maintenance from './pages/Maintenance.jsx'
import Documents from './pages/Documents.jsx'
import Analytics from './pages/Analytics.jsx' // NEW

// Auth + Supabase
import Auth from './pages/Auth'
import { supabase } from './supabaseClient'

// Tenant Portal
import TenantPortal from './pages/TenantPortal'

// Small error view so we never get a white screen
function Crash({ err }) {
  return (
    <div style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h3 style={{ marginTop: 0 }}>Something went wrong</h3>
      <pre style={{ whiteSpace: 'pre-wrap', background:'#111827', color:'#e5e7eb', padding:12, borderRadius:8, overflow:'auto' }}>
        {String(err)}
      </pre>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [session, setSession] = useState(null)
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [fatal, setFatal] = useState(null)

  // ---- Owner data (for Dashboard + Properties) ----
  const [properties, setProperties] = useState([])
  const [propsLoading, setPropsLoading] = useState(false)
  const [propsError, setPropsError] = useState(null)

  const [tenantsData, setTenantsData] = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [tenantsError, setTenantsError] = useState(null)

  const [leasesData, setLeasesData] = useState([])
  const [leasesLoading, setLeasesLoading] = useState(false)
  const [leasesError, setLeasesError] = useState(null)

  useEffect(() => {
    let unsub
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setSession(data?.session || null)
        unsub = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess)).data?.subscription
      } catch (e) { setFatal(e) }
    })()
    return () => { unsub?.unsubscribe?.() }
  }, [])

  useEffect(() => {
    if (!session) return
    ;(async () => {
      try {
        const uid = session.user.id
        const { data, error } = await supabase.from('app_users').select('role').eq('auth_id', uid).limit(1)
        if (error) throw error
        setRole(data?.[0]?.role || 'owner')
      } catch (e) {
        setRole('owner')
        setStatus('Connected (check policies)')
      }
    })()
  }, [session])

  useEffect(() => {
    if (!session) return
    ;(async () => {
      try {
        const { error } = await supabase.from('properties').select('id').limit(1)
        setStatus(error ? 'Connected (check policies)' : 'Supabase connected ✅')
      } catch { setStatus('Connected (check policies)') }
    })()
  }, [session])

  async function fetchProperties() {
    try {
      setPropsLoading(true); setPropsError(null)
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address, monthly_rent, status')
        .order('name')
      if (error) throw error
      setProperties(data || [])
    } catch (e) {
      setPropsError(e.message || 'Failed to load properties'); setProperties([])
    } finally { setPropsLoading(false) }
  }
  async function fetchTenants() {
    try {
      setTenantsLoading(true); setTenantsError(null)
      const { data, error } = await supabase.from('tenants').select('id').order('id')
      if (error) throw error
      setTenantsData(data || [])
    } catch (e) {
      setTenantsError(e.message || 'Failed to load tenants'); setTenantsData([])
    } finally { setTenantsLoading(false) }
  }
  async function fetchLeases() {
    try {
      setLeasesLoading(true); setLeasesError(null)
      const { data, error } = await supabase.from('leases').select('id').order('start_date', { ascending: false })
      if (error) throw error
      setLeasesData(data || [])
    } catch (e) {
      setLeasesError(e.message || 'Failed to load leases'); setLeasesData([])
    } finally { setLeasesLoading(false) }
  }

  useEffect(() => {
    if (!session || role === 'tenant') return
    fetchProperties(); fetchTenants(); fetchLeases()
  }, [session, role])

  useEffect(() => {
    if (!session || role === 'tenant') return
    if (tab === 'properties') fetchProperties()
  }, [tab])

  async function handleLogout() { try { await supabase.auth.signOut() } catch {} }

  if (fatal) return <Crash err={fatal} />
  if (!session) return <Auth />

if (role === 'tenant') {
  return (
    // Full-bleed container so the Tenant Portal can use the entire width
    <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', minHeight: '100vh', background: '#f8fafc' }}>
      <Topbar title="Tenant Portal" status={`${status} • Role: tenant`} onLogout={handleLogout} />
      {/* Render TenantPortal directly (no centered/main wrapper) */}
      <TenantPortal />
    </div>
  )
}


  return (
    <div style={styles.app}>
      <Sidebar tab={tab} setTab={setTab} />
      <div style={styles.page}>
        <Topbar title={tab[0].toUpperCase() + tab.slice(1)} status={`${status} • Role: ${role || 'owner'}`} onLogout={handleLogout} />
        <main style={styles.container}>
          {tab === 'dashboard' && (
            <Dashboard
              properties={properties} propsLoading={propsLoading} propsError={propsError}
              tenants={tenantsData} tenantsLoading={tenantsLoading} tenantsError={tenantsError}
              leases={leasesData} leasesLoading={leasesLoading} leasesError={leasesError}
            />
          )}
          {tab === 'properties' && (
            <Properties
              properties={properties}
              propsLoading={propsLoading}
              propsError={propsError}
              refetchProperties={fetchProperties}
            />
          )}
          {tab === 'tenants' && <Tenants />}
          {tab === 'leases' && <Leases />}
          {tab === 'maintenance' && <Maintenance />}
          {tab === 'documents' && <Documents />}
          {tab === 'analytics' && <Analytics />}{/* NEW */}
        </main>
      </div>
    </div>
  )
}
