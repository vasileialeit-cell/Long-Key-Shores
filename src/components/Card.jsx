import React from 'react'
import styles from '../styles/styles'
export default function Card({ title, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHead}><h3 style={{margin:0,fontSize:16}}>{title}</h3></div>
      <div>{children}</div>
    </div>
  )
}
