export function Card({ title, children, className = '' }) {
  return (
    <section className={className} style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, background: '#fff' }}>
      {title ? <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>{title}</h2> : null}
      {children}
    </section>
  );
}

export function Button({ children, onClick, type = 'button', variant = 'primary' }) {
  const styles = {
    primary: { background: '#0f766e', color: '#fff', border: 'none' },
    secondary: { background: '#f3f4f6', color: '#111827', border: '1px solid #d1d5db' },
    danger: { background: '#dc2626', color: '#fff', border: 'none' }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        ...styles[variant],
        borderRadius: 10,
        padding: '10px 14px',
        fontWeight: 600,
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}

export function Badge({ children, variant = 'neutral' }) {
  const colors = {
    neutral: { background: '#f3f4f6', color: '#111827' },
    success: { background: '#dcfce7', color: '#166534' },
    warning: { background: '#fef3c7', color: '#92400e' },
    info: { background: '#dbeafe', color: '#1d4ed8' }
  };

  return (
    <span style={{ ...colors[variant], borderRadius: 999, padding: '6px 10px', display: 'inline-block', fontSize: 12, fontWeight: 700 }}>
      {children}
    </span>
  );
}
