// src/styles/styles.js
const styles = {
  // App frame: sidebar + page
  app: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    background: '#f8fafc',
  },

  // Right side (topbar + main content)
  page: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0, // prevent overflow
  },

  // Top navigation bar wrapper (if your Topbar uses it)
  topbarWrap: {
    width: '100%',
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    position: 'relative',
    zIndex: 5,
  },

  // Main content container
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px',
    // IMPORTANT: no big margins/padding that push content down
  },

  // Common UI atoms
  primaryBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    background: '#fff',
    color: '#111827',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '10px 14px',
    cursor: 'pointer',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  input: {
    width: '100%',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '10px 12px',
    outline: 'none',
  },
  stack: {
    display: 'grid',
    gap: 16,
  },
}

export default styles
