'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('farmer');
  const [kisaanId, setKisaanId] = useState('IN-ABCD1234');
  const [mobile, setMobile] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [status, setStatus] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const nextRole = new URLSearchParams(window.location.search).get('role') || 'farmer';
    setRole(nextRole);
  }, []);

  async function handleVerifyKisaan(e) {
    e.preventDefault();
    setStatus('Verifying your Kisaan ID...');

    const response = await fetch('/api/auth/verify-kisaan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kisaanId, mobile })
    });

    const payload = await response.json();
    setStatus(payload.message || 'Verification status');
    if (payload.ok) {
      setVerified(true);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setStatus('Verifying OTP...');

    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kisaanId, mobile, otp, role })
    });

    const payload = await response.json();
    setStatus(payload.message || 'OTP status');
    if (payload.ok) {
      router.push(payload.redirect || '/farmer');
    }
  }

  if (role === 'buyer') {
    return (
      <main style={{ maxWidth: 420, margin: '64px auto', padding: 24 }}>
        <h1>Buyer access</h1>
        <p style={{ color: '#4b5563' }}>Sign in with Google to continue. Company linkage is required before access is granted.</p>
        <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
          <a href="/api/auth/signin/google?callbackUrl=/buyer" style={{ display: 'inline-block', background: '#111827', color: '#fff', textAlign: 'center', padding: '12px 16px', borderRadius: 10, textDecoration: 'none' }}>
            Continue with Google
          </a>
          <a href="/buyer/link-company" style={{ display: 'inline-block', textAlign: 'center', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db', textDecoration: 'none', color: '#111827' }}>
            Link company ID
          </a>
        </div>
      </main>
    );
  }

  if (role === 'seller') {
    return (
      <main style={{ maxWidth: 420, margin: '64px auto', padding: 24 }}>
        <h1>Seller access</h1>
        <p style={{ color: '#4b5563' }}>Google OAuth only.</p>
        <a href="/api/auth/signin/google?callbackUrl=/seller" style={{ display: 'inline-block', background: '#0f766e', color: '#fff', textAlign: 'center', padding: '12px 16px', borderRadius: 10, textDecoration: 'none', marginTop: 18 }}>
          Continue with Google
        </a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: '64px auto', padding: 24 }}>
      <h1>Farmer login</h1>
      <p style={{ color: '#4b5563' }}>Verify Govt Kisaan ID and mobile before final OTP login.</p>

      <form onSubmit={handleVerifyKisaan} style={{ display: 'grid', gap: 12, marginTop: 18 }}>
        <input value={kisaanId} onChange={(e) => setKisaanId(e.target.value)} placeholder="Kisaan ID" style={{ padding: 12, borderRadius: 10, border: '1px solid #d1d5db' }} />
        <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number" style={{ padding: 12, borderRadius: 10, border: '1px solid #d1d5db' }} />
        <button type="submit" style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 16px', fontWeight: 600 }}>Verify Kisaan ID</button>
      </form>

      {verified ? (
        <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" style={{ padding: 12, borderRadius: 10, border: '1px solid #d1d5db' }} />
          <button type="submit" style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 16px', fontWeight: 600 }}>Verify OTP and Sign In</button>
        </form>
      ) : null}

      {status ? <p style={{ marginTop: 12, color: '#374151' }}>{status}</p> : null}
    </main>
  );
}
