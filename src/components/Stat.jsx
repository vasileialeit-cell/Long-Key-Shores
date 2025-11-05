import React from 'react'
import styles from '../styles/styles'
export default function Stat({ label, value, loading }) {
  return (
    <div style={styles.statBox}>
      <div style={styles.statValue}>{loading ? '…' : value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}
