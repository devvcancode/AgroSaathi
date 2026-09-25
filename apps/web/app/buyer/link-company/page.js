'use client';

import { useState } from 'react';

export default function LinkCompanyPage() {
  const [companyId, setCompanyId] = useState('COMP-XYZ123');
  const [status, setStatus] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const response = await fetch('/api/auth/company-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId })
    });

    const payload = await response.json();
    setStatus(payload.message || 'Company validation status');

    if (payload.ok) {
      window.location.href = payload.redirect || '/buyer';
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '64px auto', padding: 24 }}>
      <h1>Link Company ID</h1>
      <p style={{ color: '#4b5563' }}>This is a stub validation step for company registration or GST verification.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        <input value={companyId} onChange={(e) => setCompanyId(e.target.value)} placeholder="Company Registration ID" style={{ padding: 12, borderRadius: 10, border: '1px solid #d1d5db' }} />
        <button type="submit" style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 16px', fontWeight: 600 }}>Validate and Link</button>
      </form>

      {status ? <p style={{ marginTop: 18, color: '#374151' }}>{status}</p> : null}
    </main>
  );
}
