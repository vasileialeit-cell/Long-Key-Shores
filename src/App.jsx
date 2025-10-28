import React, { useEffect, useMemo, useState } from "react";

/**
 * Long Key Shores – DoorLoop-style MVP (polished UI)
 * - Sidebar navigation (Dashboard, Properties, Tenants, Leases, Payments, Maintenance, Reports, Settings)
 * - Top bar with role switcher (Admin / Owner / Tenant) and search
 * - Clean cards, tables, forms, and modals (no external deps)
 * - Persists data to localStorage (mock DB)
 */

const DB_KEY = "lks_ui_db_v1";
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const uid = (p) => `${p}_${Math.random().toString(36).slice(2,8)}`;

const SEED = {
  users: [
    { id: "u_admin", role: "admin", name: "LKS Admin", email: "admin@longkeyshores.com" },
    { id: "u_owner1", role: "owner", name: "Owner – Smith Holdings", email: "owner@smithholdings.com" },
    { id: "u_tenant1", role: "tenant", name: "John Doe", email: "john@example.com" },
    { id: "u_tenant2", role: "tenant", name: "Jane Smith", email: "jane@example.com" },
  ],
  properties: [
    { id: "p1", name: "Ocean View Villa", address: "123 Shoreline Dr", ownerId: "u_owner1", rent: 2500, status: "Occupied" },
    { id: "p2", name: "Sunset Cottage", address: "77 Gulf Blvd", ownerId: "u_owner1", rent: 1800, status: "Occupied" },
  ],
  tenants: [
    { id: "t1", userId: "u_tenant1", phone: "+1 555-0101" },
    { id: "t2", userId: "u_tenant2", phone: "+1 555-0102" },
  ],
  leases: [
    { id: "l1", propertyId: "p1", tenantId: "t1", start: "2025-01-01", end: "2025-12-31", monthlyRent: 2500, dueDay: 1, active: true },
    { id: "l2", propertyId: "p2", tenantId: "t2", start: "2025-03-01", end: "2026-02-28", monthlyRent: 1800, dueDay: 1, active: true },
  ],
  payments: [
    { id: "pay_001", leaseId: "l1", date: "2025-10-01", amount: 2500, method: "card", memo: "October Rent" },
    { id: "pay_002", leaseId: "l2", date: "2025-10-01", amount: 1800, method: "card", memo: "October Rent" },
  ],
  maintenance: [
    { id: "m1", propertyId: "p1", title: "Leaky faucet", description: "Kitchen sink dripping", status: "Open", createdAt: "2025-10-15" },
  ],
};

const loadDB = () => {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || SEED; } catch { return SEED; }
};
const saveDB = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

const Icon = ({ name, size=18 }) => (
  <span aria-hidden style={{display:'inline-block', width:size, textAlign:'center'}}>
    {name === 'home' && '🏠'}
    {name === 'keys' && '🗝️'}
    {name === 'users' && '👥'}
    {name === 'file' && '📄'}
    {name === 'cash' && '💳'}
    {name === 'wrench' && '🔧'}
    {name === 'chart' && '📈'}
    {name === 'gear' && '⚙️'}
  </span>
);

const Card = ({ title, action, children }) => (
  <div className="card">
    <div className="card_head">
      <h3>{title}</h3>
      {action}
    </div>
    <div>{children}</div>
  </div>
);

const Stat = ({ label, value }) => (
  <div className="stat">
    <div className="stat_value">{value}</div>
    <div className="stat_label">{label}</div>
  </div>
);

export default function App(){
    
  // 🔍 Test Supabase connection
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from('properties').select('*')
      if (error) {
        console.error('❌ Supabase error:', error)
      } else {
        console.log('✅ Supabase connection works! Properties:', data)
      }
    }
    testConnection()
  }, [])
  const [db, setDb] = useState(loadDB());
  const [role, setRole] = useState('admin');
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showAddLease, setShowAddLease] = useState(false);

  useEffect(()=> saveDB(db), [db]);

  const companyOwnerId = 'u_owner1';
  const leasesVisible = role==='admin'
    ? db.leases
    : role==='owner'
      ? db.leases.filter(l=> db.properties.find(p=>p.id===l.propertyId)?.ownerId===companyOwnerId)
      : db.leases.filter(l=> l.tenantId==='t1');

  const incomeThisMonth = db.payments.filter(p=> p.date.startsWith(monthKey()))
    .reduce((s,p)=> s+Number(p.amount||0),0);
  const openMaintCount = db.maintenance.filter(m=> m.status!=='Closed').length;

  const findUser = (id)=> db.users.find(u=>u.id===id);
  const propertyName = (id)=> db.properties.find(p=>p.id===id)?.name || '—';
  const tenantName = (tenantId)=> findUser(db.tenants.find(t=>t.id===tenantId)?.userId||'')?.name || '—';

  const addProperty = (payload)=> setDb(d=> ({...d, properties:[...d.properties, { id: uid('p'), status:'Vacant', ...payload }]}));
  const addTenant = ({name, email, phone})=> setDb(d=>{
    const userId = uid('u'); const tenantId = uid('t');
    return {...d, users:[...d.users, {id:userId, role:'tenant', name, email}], tenants:[...d.tenants, {id:tenantId, userId, phone}]};
  });
  const addLease = (payload)=> setDb(d=> ({...d, leases:[...d.leases, { id: uid('l'), active:true, ...payload }]}));
  const recordPayment = (payload)=> setDb(d=> ({...d, payments:[...d.payments, { id: uid('pay'), ...payload }]}));
  const newMaint = (payload)=> setDb(d=> ({...d, maintenance:[...d.maintenance, { id: uid('m'), createdAt: todayISO(), status:'Open', ...payload }]}));
  const closeMaint = (id)=> setDb(d=> ({...d, maintenance: d.maintenance.map(m=> m.id===id? {...m, status:'Closed'} : m)}));

  const [pf, setPf] = useState({ name:'', address:'', ownerId: companyOwnerId, rent: 0 });
  const [tf, setTf] = useState({ name:'', email:'', phone:'' });
  const [lf, setLf] = useState({ propertyId: db.properties[0]?.id||'', tenantId: db.tenants[0]?.id||'', start: todayISO(), end: '2026-12-31', monthlyRent: 0, dueDay: 1 });
  const [mf, setMf] = useState({ propertyId: db.properties[0]?.id||'', title:'', description:'' });

  const filteredProps = db.properties.filter(p=>
    [p.name, p.address].some(x=> (x||'').toLowerCase().includes(query.toLowerCase()))
  );
  const filteredTenants = db.tenants.filter(t=>
    (findUser(t.userId)?.name||'').toLowerCase().includes(query.toLowerCase())
  );
  const filteredLeases = leasesVisible.filter(l=>
    propertyName(l.propertyId).toLowerCase().includes(query.toLowerCase()) ||
    tenantName(l.tenantId).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={`shell ${sidebarOpen? 'sidebar-open':'sidebar-closed'}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">🗝️</div>
          <div className="brand_text">
            <strong>Long Key Shores</strong>
            <span className="muted">Property Management</span>
          </div>
        </div>
        <nav>
          <a className={tab==='dashboard'? 'active': ''} onClick={()=>setTab('dashboard')}><Icon name="home"/> Dashboard</a>
          <a className={tab==='properties'? 'active': ''} onClick={()=>setTab('properties')}><Icon name="keys"/> Properties</a>
          <a className={tab==='tenants'? 'active': ''} onClick={()=>setTab('tenants')}><Icon name="users"/> Tenants</a>
          <a className={tab==='leases'? 'active': ''} onClick={()=>setTab('leases')}><Icon name="file"/> Leases</a>
          <a className={tab==='payments'? 'active': ''} onClick={()=>setTab('payments')}><Icon name="cash"/> Payments</a>
          <a className={tab==='maintenance'? 'active': ''} onClick={()=>setTab('maintenance')}><Icon name="wrench"/> Maintenance</a>
          <a className={tab==='reports'? 'active': ''} onClick={()=>setTab('reports')}><Icon name="chart"/> Reports</a>
          <a className={tab==='settings'? 'active': ''} onClick={()=>setTab('settings')}><Icon name="gear"/> Settings</a>
        </nav>
        <div className="sidebar_footer">
          <button className="btn ghost small" onClick={()=>setSidebarOpen(s=>!s)}>{sidebarOpen? 'Collapse':'Expand'}</button>
          <div className="copy">© {new Date().getFullYear()} LKS</div>
        </div>
      </aside>

      {/* MAIN */}
      <section className="main">
        <header className="topbar">
          <div className="breadcrumbs">{tab[0].toUpperCase()+tab.slice(1)}</div>
          <div className="toolbar">
            <div className="search">
              <input placeholder={`Search ${tab}...`} value={query} onChange={e=>setQuery(e.target.value)} />
            </div>
            <div className="role">
              <span className="muted">Role</span>
              <select value={role} onChange={(e)=> setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>
            <div className="avatar">VL</div>
          </div>
        </header>

        <div className="content">
          {tab==='dashboard' && (
            <div className="grid3">
              <Card title="Income (This Month)"><Stat value={`$${incomeThisMonth.toLocaleString()}`} label="Total collected"/></Card>
              <Card title="Active Leases"><Stat value={db.leases.filter(l=>l.active).length} label="Leases"/></Card>
              <Card title="Open Maintenance"><Stat value={openMaintCount} label="Requests"/></Card>

              <Card title="Recent Payments">
                <table className="table">
                  <thead><tr><th>Date</th><th>Property</th><th>Amount</th><th>Method</th></tr></thead>
                  <tbody>
                    {[...db.payments].reverse().slice(0,7).map(p=>{
                      const lease = db.leases.find(l=>l.id===p.leaseId);
                      return (
                        <tr key={p.id}><td>{p.date}</td><td>{propertyName(lease?.propertyId)}</td><td>${Number(p.amount).toLocaleString()}</td><td>{p.method}</td></tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>

              <Card title="Open Maintenance">
                {db.maintenance.filter(m=>m.status!=='Closed').length===0 ? <div className="empty">No open requests</div> : (
                  <ul className="list">
                    {db.maintenance.filter(m=>m.status!=='Closed').map(m=> (
                      <li key={m.id}><strong>{propertyName(m.propertyId)}</strong> — {m.title} <span className="pill warning">Open</span></li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {tab==='properties' && (
            <div className="columns">
              <div>
                <div className="actionbar">
                  <div className="filters">
                    <select>
                      <option>All Statuses</option>
                      <option>Occupied</option>
                      <option>Vacant</option>
                    </select>
                  </div>
                  <button className="btn" onClick={()=>setShowAddProperty(true)}>+ Add Property</button>
                </div>
                <Card title="Properties">
                  <table className="table table-hover">
                    <thead><tr><th>Name</th><th>Address</th><th>Owner</th><th>Rent</th><th>Status</th></tr></thead>
                    <tbody>
                      {filteredProps.map(p=>{
                        const owner = findUser(p.ownerId)?.name || '—';
                        return (<tr key={p.id}><td>{p.name}</td><td>{p.address}</td><td>{owner}</td><td>${p.rent}</td><td>{p.status}</td></tr>);
                      })}
                    </tbody>
                  </table>
                  {filteredProps.length===0 && <div className="empty">No properties match your search.</div>}
                </Card>
              </div>
            </div>
          )}

          {tab==='tenants' && (
            <div className="columns">
              <div>
                <div className="actionbar">
                  <div className="filters"/>
                  <button className="btn" onClick={()=>setShowAddTenant(true)}>+ Add Tenant</button>
                </div>
                <Card title="Tenants">
                  <table className="table table-hover">
                    <thead><tr><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
                    <tbody>
                      {filteredTenants.map(t=>{
                        const u = findUser(t.userId)||{}; return (<tr key={t.id}><td>{u.name}</td><td>{u.email}</td><td>{t.phone}</td></tr>);
                      })}
                    </tbody>
                  </table>
                  {filteredTenants.length===0 && <div className="empty">No tenants match your search.</div>}
                </Card>
              </div>
            </div>
          )}

          {tab==='leases' && (
            <div className="columns">
              <div>
                <div className="actionbar">
                  <div className="filters"/>
                  {role!=='tenant' && <button className="btn" onClick={()=>setShowAddLease(true)}>+ Add Lease</button>}
                </div>
                <Card title="Leases">
                  <table className="table table-hover">
                    <thead><tr><th>Property</th><th>Tenant</th><th>Start</th><th>End</th><th>Rent</th><th>Due Day</th><th>Status</th></tr></thead>
                    <tbody>
                      {filteredLeases.map(l=> (
                        <tr key={l.id}><td>{propertyName(l.propertyId)}</td><td>{tenantName(l.tenantId)}</td><td>{l.start}</td><td>{l.end}</td><td>${l.monthlyRent}</td><td>{l.dueDay}</td><td>{l.active? <span className="pill">Active</span> : <span className="pill muted">Inactive</span>}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLeases.length===0 && <div className="empty">No leases match your search.</div>}
                </Card>
              </div>
            </div>
          )}

          {tab==='payments' && (
            <div className="columns">
              <div>
                <Card title="Payments">
                  <table className="table table-hover">
                    <thead><tr><th>Date</th><th>Property</th><th>Amount</th><th>Method</th><th>Memo</th></tr></thead>
                    <tbody>
                      {[...db.payments].reverse().map(p=>{
                        const lease = db.leases.find(l=>l.id===p.leaseId);
                        return (<tr key={p.id}><td>{p.date}</td><td>{propertyName(lease?.propertyId)}</td><td>${Number(p.amount).toLocaleString()}</td><td>{p.method}</td><td>{p.memo}</td></tr>);
                      })}
                    </tbody>
                  </table>
                </Card>
              </div>
              <div>
                <Card title={role==='tenant'? 'Pay Rent (Mock)' : 'Record Payment'}>
                  {role==='tenant' ? (
                    <button className="btn" onClick={()=>{
                      const myLease = leasesVisible[0];
                      if(!myLease) return alert('No lease found');
                      recordPayment({ leaseId: myLease.id, date: todayISO(), amount: myLease.monthlyRent, method: 'card', memo: `Rent ${monthKey()}` });
                      alert('Payment recorded (mock). We will wire Stripe later.');
                    }}>Pay Now</button>
                  ) : (
                    <PaymentForm db={db} onSave={recordPayment}/>
                  )}
                </Card>
              </div>
            </div>
          )}

          {tab==='maintenance' && (
            <div className="columns">
              <div>
                <Card title="Requests" action={<span className="muted">Click a row to close</span>}>
                  <table className="table table-hover clickable">
                    <thead><tr><th>Date</th><th>Property</th><th>Title</th><th>Status</th></tr></thead>
                    <tbody>
                      {db.maintenance.map(m=> (
                        <tr key={m.id} onClick={()=> m.status!=='Closed' && closeMaint(m.id)}>
                          <td>{m.createdAt}</td><td>{propertyName(m.propertyId)}</td><td>{m.title}</td><td>{m.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
              <div>
                <Card title="New Request">
                  <FormRow label="Property">
                    <select value={mf.propertyId} onChange={e=>setMf({...mf, propertyId:e.target.value})}>
                      {db.properties.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </FormRow>
                  <FormRow label="Title"><input value={mf.title} onChange={e=>setMf({...mf,title:e.target.value})} placeholder="Short description"/></FormRow>
                  <FormRow label="Details"><textarea value={mf.description} onChange={e=>setMf({...mf,description:e.target.value})} rows={3}/></FormRow>
                  <button className="btn" onClick={()=>{ if(!mf.title) return alert('Title required'); newMaint(mf); setMf({ propertyId: db.properties[0]?.id||'', title:'', description:'' }); }}>Submit</button>
                </Card>
              </div>
            </div>
          )}

          {tab==='reports' && (
            <div className="columns">
              <div>
                <Card title="Owner Statement (This Month)">
                  <ul className="list">
                    {db.properties.filter(p=>p.ownerId===companyOwnerId).map(p=>{
                      const leaseIds = db.leases.filter(l=>l.propertyId===p.id).map(l=>l.id);
                      const income = db.payments.filter(pp=> leaseIds.includes(pp.leaseId) && pp.date.startsWith(monthKey()))
                        .reduce((s,x)=> s+Number(x.amount),0);
                      return <li key={p.id}><strong>{p.name}</strong>: ${income.toLocaleString()}</li>;
                    })}
                  </ul>
                </Card>
              </div>
              <div>
                <Card title="Overdue (AR)">
                  <ul className="list">
                    {db.leases.map(l=>{
                      const mk = monthKey();
                      const paid = db.payments.some(p=> p.leaseId===l.id && p.date.startsWith(mk));
                      const due = new Date(`${mk}-${String(l.dueDay).padStart(2,'0')}`);
                      if (paid || new Date() <= due) return null;
                      return <li key={l.id}><strong>{propertyName(l.propertyId)}</strong> — {tenantName(l.tenantId)} <span className="pill danger">OVERDUE</span> ${l.monthlyRent}</li>;
                    })}
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {tab==='settings' && (
            <div className="columns">
              <div>
                <Card title="Branding">
                  <FormRow label="Company Name"><input defaultValue="Long Key Shores"/></FormRow>
                  <FormRow label="Accent Color"><input type="color" defaultValue="#0ea5e9"/></FormRow>
                  <button className="btn" onClick={()=>alert('Saved (demo).')}>Save</button>
                </Card>
              </div>
              <div>
                <Card title="Utilities">
                  <button className="btn ghost" onClick={()=>{localStorage.removeItem(DB_KEY); location.reload();}}>Reset Demo Data</button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MODALS */}
      {showAddProperty && (
        <Modal title="Add Property" onClose={()=>setShowAddProperty(false)}>
          <FormRow label="Name"><input value={pf.name} onChange={e=>setPf({...pf,name:e.target.value})}/></FormRow>
          <FormRow label="Address"><input value={pf.address} onChange={e=>setPf({...pf,address:e.target.value})}/></FormRow>
          <FormRow label="Owner">
            <select value={pf.ownerId} onChange={e=>setPf({...pf,ownerId:e.target.value})}>
              {db.users.filter(u=>u.role==='owner').map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </FormRow>
          <div className="inline">
            <FormRow label="Monthly Rent"><input type="number" value={pf.rent} onChange={e=>setPf({...pf,rent:Number(e.target.value)})}/></FormRow>
          </div>
          <div className="modal_actions">
            <button className="btn" onClick={()=>{ if(!pf.name) return alert('Name required'); addProperty(pf); setPf({ name:'', address:'', ownerId: companyOwnerId, rent:0 }); setShowAddProperty(false); }}>Save</button>
            <button className="btn ghost" onClick={()=>setShowAddProperty(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {showAddTenant && (
        <Modal title="Add Tenant" onClose={()=>setShowAddTenant(false)}>
          <FormRow label="Full Name"><input value={tf.name} onChange={e=>setTf({...tf,name:e.target.value})}/></FormRow>
          <FormRow label="Email"><input value={tf.email} onChange={e=>setTf({...tf,email:e.target.value})}/></FormRow>
          <FormRow label="Phone"><input value={tf.phone} onChange={e=>setTf({...tf,phone:e.target.value})}/></FormRow>
          <div className="modal_actions">
            <button className="btn" onClick={()=>{ if(!tf.name||!tf.email) return alert('Name & Email required'); addTenant(tf); setTf({name:'',email:'',phone:''}); setShowAddTenant(false); }}>Save</button>
            <button className="btn ghost" onClick={()=>setShowAddTenant(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {showAddLease && (
        <Modal title="Add Lease" onClose={()=>setShowAddLease(false)}>
          <FormRow label="Property">
            <select value={lf.propertyId} onChange={e=>setLf({...lf,propertyId:e.target.value})}>
              {db.properties.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormRow>
          <FormRow label="Tenant">
            <select value={lf.tenantId} onChange={e=>setLf({...lf,tenantId:e.target.value})}>
              {db.tenants.map(t=> <option key={t.id} value={t.id}>{tenantName(t.id)}</option>)}
            </select>
          </FormRow>
          <div className="inline">
            <FormRow label="Start"><input type="date" value={lf.start} onChange={e=>setLf({...lf,start:e.target.value})}/></FormRow>
            <FormRow label="End"><input type="date" value={lf.end} onChange={e=>setLf({...lf,end:e.target.value})}/></FormRow>
          </div>
          <div className="inline">
            <FormRow label="Monthly Rent"><input type="number" value={lf.monthlyRent} onChange={e=>setLf({...lf,monthlyRent:Number(e.target.value)})}/></FormRow>
            <FormRow label="Due Day"><input type="number" value={lf.dueDay} onChange={e=>setLf({...lf,dueDay:Number(e.target.value)})}/></FormRow>
          </div>
          <div className="modal_actions">
            <button className="btn" onClick={()=>{ if(!lf.monthlyRent) return alert('Monthly rent required'); addLease(lf); setLf({ propertyId: db.properties[0]?.id||'', tenantId: db.tenants[0]?.id||'', start: todayISO(), end:'2026-12-31', monthlyRent: 0, dueDay: 1 }); setShowAddLease(false); }}>Save</button>
            <button className="btn ghost" onClick={()=>setShowAddLease(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      <style>{`
        :root{ --bg:#f5f7fb; --card:#ffffff; --ink:#0f172a; --muted:#6b7280; --brand:#1166ff; --brand-ink:#0b4ed9; --line:#e5e7eb; --surface:#0b1220; }
        *{ box-sizing:border-box; }
        body,html,#root{ height:100%; }
        .shell{ display:flex; min-height:100vh; background:var(--bg); color:var(--ink); }
        .sidebar{ width:280px; background:var(--surface); color:#fff; display:flex; flex-direction:column; transition: width .18s ease; }
        .sidebar-closed .sidebar{ width:76px; }
        .brand{ display:flex; align-items:center; gap:12px; padding:16px; border-bottom:1px solid rgba(255,255,255,.08); }
        .logo{ width:36px; height:36px; border-radius:12px; background:linear-gradient(135deg, #38bdf8, #1166ff); display:flex; align-items:center; justify-content:center; font-size:20px; }
        .brand_text{ display:flex; flex-direction:column; }
        .sidebar-closed .brand_text{ display:none; }
        .sidebar nav{ display:flex; flex-direction:column; padding:8px; gap:4px; }
        .sidebar nav a{ display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; color:#cbd5e1; cursor:pointer; white-space:nowrap; }
        .sidebar nav a.active, .sidebar nav a:hover{ background:rgba(255,255,255,.08); color:#fff; }
        .sidebar_footer{ margin-top:auto; padding:10px 12px; color:#93c5fd; font-size:12px; display:flex; align-items:center; justify-content:space-between; }
        .copy{ opacity:.8; }
        .main{ flex:1; display:flex; flex-direction:column; }
        .topbar{ position:sticky; top:0; background:var(--card); border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:10px 16px; z-index:5; }
        .breadcrumbs{ font-weight:700; letter-spacing:.2px; }
        .toolbar{ display:flex; align-items:center; gap:12px; }
        .search input{ width:220px; padding:8px 10px; border:1px solid var(--line); border-radius:10px; }
        .role select{ margin-left:6px; padding:6px 8px; border:1px solid var(--line); border-radius:8px; }
        .avatar{ width:32px; height:32px; border-radius:50%; background:#dbeafe; color:#1e3a8a; display:flex; align-items:center; justify-content:center; font-weight:800; }
        .content{ padding:16px; }
        .grid3{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:16px; }
        .columns{ display:grid; grid-template-columns: 2fr 1fr; gap:16px; }
        @media(max-width:1100px){ .grid3{ grid-template-columns:1fr; } .columns{ grid-template-columns:1fr; } .sidebar{ position:fixed; inset:0 0 0 0; width:260px; z-index:50; } }
        .card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:14px; box-shadow:0 1px 2px rgba(0,0,0,.03); }
        .card_head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .card h3{ font-size:16px; margin:0; }
        .stat_value{ font-size:28px; font-weight:800; }
        .stat_label{ color:var(--muted); font-size:12px; }
        .btn{ background:var(--brand); color:#fff; border:none; border-radius:10px; padding:8px 14px; font-weight:700; cursor:pointer; box-shadow:0 1px 0 #0b4ed9 inset; }
        .btn:hover{ filter:brightness(.96); }
        .btn.ghost{ background:transparent; color:#fff; border:1px solid rgba(255,255,255,.35); }
        .btn.ghost.small{ padding:6px 10px; font-size:12px; }
        .pill{ background:#e2f2ff; color:#075985; border-radius:999px; padding:2px 8px; font-size:12px; }
        .pill.warning{ background:#fff7ed; color:#b45309; }
        .pill.danger{ background:#fee2e2; color:#991b1b; }
        .pill.muted{ background:#e2e8f0; color:#334155; }
        .table{ width:100%; border-collapse: collapse; font-size:14px; }
        .table thead th{ text-align:left; color:var(--muted); font-weight:600; border-bottom:1px solid var(--line); padding:10px 8px; }
        .table td{ padding:12px 8px; border-bottom:1px solid var(--line); }
        .table-hover tbody tr:hover{ background:#f8fafc; }
        .table.clickable tr{ cursor:pointer; }
        .empty{ padding:18px; text-align:center; color:var(--muted); }
        .actionbar{ display:flex; align-items:center; justify-content:space-between; margin:0 0 10px 0; }
        .list{ display:grid; gap:10px; padding-left:18px; }
        .inline{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        input, select, textarea{ width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:10px; background:white; }
        textarea{ resize:vertical; }
        .modal_backdrop{ position:fixed; inset:0; background:rgba(11,18,32,.48); display:flex; align-items:center; justify-content:center; z-index:60; }
        .modal{ background:white; width:min(560px, 92vw); border-radius:16px; border:1px solid var(--line); box-shadow:0 10px 30px rgba(0,0,0,.12); }
        .modal_head{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--line); }
        .modal_body{ padding:14px 16px; }
        .modal_actions{ display:flex; gap:8px; justify-content:flex-end; padding:0 16px 16px; }
      `}</style>
    </div>
  );
}

function Modal({ title, onClose, children }){
  return (
    <div className="modal_backdrop" onClick={(e)=> e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal_head">
          <strong>{title}</strong>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
        <div className="modal_body">{children}</div>
      </div>
    </div>
  );
}

function FormRow({ label, children }){
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="muted" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function PaymentForm({ db, onSave }){
  const [f, setF] = useState({ leaseId: db.leases[0]?.id || '', date: todayISO(), amount: 0, method:'card', memo:'Manual' });
  return (
    <div>
      <FormRow label="Lease">
        <select value={f.leaseId} onChange={e=>setF({...f,leaseId:e.target.value})}>
          {db.leases.map(l=> <option key={l.id} value={l.id}>{`${l.id} – ${l.start} – $${l.monthlyRent}`}</option>)}
        </select>
      </FormRow>
      <div className="inline">
        <FormRow label="Date"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></FormRow>
        <FormRow label="Amount"><input type="number" value={f.amount} onChange={e=>setF({...f,amount:Number(e.target.value)})}/></FormRow>
      </div>
      <FormRow label="Method">
        <select value={f.method} onChange={e=>setF({...f,method:e.target.value})}>
          <option value="card">Card</option>
          <option value="bank">Bank Transfer</option>
          <option value="cash">Cash</option>
        </select>
      </FormRow>
      <FormRow label="Memo"><input value={f.memo} onChange={e=>setF({...f,memo:e.target.value})}/></FormRow>
      <button className="btn" onClick={()=>{ if(!f.amount) return alert('Amount required'); onSave(f); alert('Payment recorded'); }}>Save Payment</button>
    </div>
  );
}

import { supabase } from './supabaseClient'


