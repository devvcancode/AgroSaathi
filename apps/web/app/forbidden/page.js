import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main style={{ maxWidth: 640, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      <h1 style={{ fontSize: 36 }}>403 — Access denied</h1>
      <p style={{ color: '#4b5563' }}>This role does not have permission to view this page.</p>
      <Link href="/login" style={{ display: 'inline-block', marginTop: 18, background: '#0f766e', color: '#fff', padding: '10px 16px', borderRadius: 10, textDecoration: 'none' }}>
        Go to login
      </Link>
    </main>
  );
}
