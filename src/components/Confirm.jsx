import React from 'react'
import Modal from './Modal'

export default function Confirm({ open, onClose, title = 'Confirm', message = 'Are you sure?', confirmText = 'Delete', onConfirm, danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div style={{ display:'grid', gap:12 }}>
        <div style={{ color:'#334155' }}>{message}</div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={onClose} style={{ border:'1px solid #e5e7eb', background:'#fff', color:'#111827', borderRadius:10, padding:'8px 12px', cursor:'pointer' }}>Cancel</button>
          <button
            onClick={() => { onConfirm?.(); onClose?.() }}
            style={{
              background: danger ? '#dc2626' : '#1166ff',
              color:'#fff', border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
