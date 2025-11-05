// src/components/Table.jsx
import React from 'react'

export default function Table({ head = [], rows = [] }) {
  return (
    <div style={s.wrap}>
      <table style={s.table}>
        {head && head.length > 0 && (
          <thead>
            <tr>
              {head.map((h, i) => (
                <th key={i} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {(rows || []).map((r, ri) => (
            <tr key={ri}>
              {(Array.isArray(r) ? r : [r]).map((cell, ci) => (
                <td key={ci} style={s.td}>
                  {cell ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const s = {
  wrap: { width: '100%', overflowX: 'auto' },
  table: {
    width: '100%', borderCollapse: 'separate', borderSpacing: 0,
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
  },
  th: {
    textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 700,
    padding: '12px 14px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap'
  },
  td: {
    padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 14, color: '#111827',
    verticalAlign: 'top', whiteSpace: 'nowrap'
  },
}
