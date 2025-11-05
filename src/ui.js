// src/ui.js

// Page layout
export const container = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: '24px 28px',
}

export const pageTitle = {
  fontSize: 36,
  fontWeight: 800,
  margin: '8px 0 12px 0',
}

// Header layout helpers
export const headerStrip = { marginTop: 6, marginBottom: 6 }

export const headerRow = (grid) => ({
  display: 'grid',
  gridTemplateColumns: grid,
  gap: 12,
  alignItems: 'center',
  color: '#64748b',
  fontWeight: 600,
  fontSize: 14,
  padding: '6px 4px',
})

export const hL = { textAlign: 'left' }
export const hC = { textAlign: 'left' }
export const hA = { textAlign: 'right' }

// Card list wrapping
export const cardsWrap = { display: 'grid', gap: 12 }

// Each card row
export const cardRow = {
  display: 'grid',
  gap: 12,
  alignItems: 'center',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: '10px 14px', // ← adjust thinner here if you want!
  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
}

export const cardGrid = (grid) => ({
  display: 'grid',
  gridTemplateColumns: grid,
  gap: 12,
  alignItems: 'center',
})

// Column content formatting
export const cL = { display: 'grid', gap: 3 }
export const cC = { color: '#475569' }
export const cA = { display: 'flex', justifyContent: 'flex-end' }

// Text formatting
export const name = { fontWeight: 700, fontSize: 18, color: '#0f172a' }
export const subline = { fontSize: 13, color: '#64748b' }

// State UI
export const emptyState = { color: '#64748b', padding: '12px 2px' }
export const errorState = { color: '#dc2626', padding: '12px 2px' }

// Menu controls
export const menuWrap = { position: 'relative', display: 'inline-block' }

export const menuBtn = {
  width: 36,
  height: 32,
  borderRadius: 10,
  cursor: 'pointer',
  border: '1px solid #e5e7eb',
  background: '#f8fafc',
}

export const menu = {
  position: 'absolute',
  right: 0,
  top: 36,
  zIndex: 20,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
  minWidth: 160,
  overflow: 'hidden',
}

export const menuItem = {
  padding: '10px 12px',
  cursor: 'pointer',
  fontWeight: 600,
  color: '#0f172a',
}
