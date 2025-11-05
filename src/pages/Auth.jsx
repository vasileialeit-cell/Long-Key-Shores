import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

const box = {
  maxWidth: 420, margin: '10vh auto', padding: 24,
  border: '1px solid #e5e7eb', borderRadius: 16, boxShadow:'0 2px 12px rgba(0,0,0,.05)'
}
const title = { fontSize: 20, fontWeight: 800, marginBottom: 8 }
const muted = { color:'#64748b', marginBottom: 18 }
const input = { width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:10, fontSize:14, background:'#fff' }
const primary = { background:'#1166ff', color:'#fff', border:'none', borderRadius:10, padding:'10px 12px', cursor:'pointer', fontSize:14, width:'100%' }
const link = { color:'#1166ff', cursor:'pointer', background:'none', border:'none', padding:0, fontSize:14 }

export default function Auth() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function signIn(e) {
    e.preventDefault()
    setMessage(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMessage(error.message)
    // success will auto redirect via App.jsx auth listener
  }

  async function signUp(e) {
    e.preventDefault()
    if (!name.trim()) return setMessage('Please enter your full name')
    setMessage(''); setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    setLoading(false)
    if (error) return setMessage(error.message)
    // Optional: ask user to verify email if confirmations are enabled
    setMessage('Account created. Check your email if confirmations are enabled, then sign in.')
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={box}>
        <div style={title}>🏝️ Long Key Shores</div>
        <div style={muted}>{mode === 'signin' ? 'Sign in to your account' : 'Create your account'}</div>
        <form onSubmit={mode === 'signin' ? signIn : signUp} style={{ display:'grid', gap:12 }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize:12, color:'#64748b' }}>Full name</label>
              <input style={input} value={name} onChange={e=>setName(e.target.value)} placeholder="Eleni Papadopoulou" />
            </div>
          )}
          <div>
            <label style={{ fontSize:12, color:'#64748b' }}>Email</label>
            <input style={input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#64748b' }}>Password</label>
            <input style={input} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} style={{ ...primary, opacity: loading ? .7 : 1 }}>
            {loading ? 'Please wait…' : (mode === 'signin' ? 'Sign in' : 'Create account')}
          </button>

          <div style={{ fontSize:13, color:'#64748b', textAlign:'center' }}>
            {mode === 'signin' ? (
              <>Don’t have an account? <button type="button" style={link} onClick={()=>setMode('signup')}>Create one</button></>
            ) : (
              <>Already have an account? <button type="button" style={link} onClick={()=>setMode('signin')}>Sign in</button></>
            )}
          </div>

          {message && <div style={{ color:'#b91c1c', fontSize:13 }}>{message}</div>}
        </form>
      </div>
    </div>
  )
}
