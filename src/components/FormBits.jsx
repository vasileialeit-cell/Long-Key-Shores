import React from 'react'
import styles from '../styles/styles'

export function Field({ label, children }) {
  return (<div><div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{label}</div>{children}</div>)
}
export function Muted({ children }) { return <div style={styles.muted}>{children}</div> }
export function ErrorBox({ err }) { return <div style={{color:'#b91c1c'}}>Error: {String(err?.message || err)}</div> }
export const buttons = {
  primary: styles.primaryBtn,
  secondary: styles.secondaryBtn
}
export const inputs = {
  base: styles.input
}
