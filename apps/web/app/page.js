import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ maxWidth: 980, margin: '48px auto', padding: 24 }}>
      <h1 style={{ fontSize: 42, marginBottom: 16 }}>AgroSaathi</h1>
      <p style={{ fontSize: 18, color: '#374151', marginBottom: 24 }}>
        Role-based marketplace for farmers, buyers and sellers.
      </p>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <RoleCard title="Farmer" href="/login?role=farmer" description="Govt Kisaan ID login with OTP flow" />
        <RoleCard title="Buyer" href="/login?role=buyer" description="Google sign-in and company linkage" />
        <RoleCard title="Seller" href="/login?role=seller" description="Google sign-in" />
      </div>
    </main>
  );
}

function RoleCard({ title, href, description }) {
  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 18, padding: 20, background: '#fff' }}>
      <h2 style={{ margin: '0 0 8px' }}>{title}</h2>
      <p style={{ color: '#4b5563', marginBottom: 16 }}>{description}</p>
      <Link href={href} style={{ display: 'inline-block', background: '#0f766e', color: '#fff', padding: '10px 14px', borderRadius: 10, textDecoration: 'none' }}>
        Open {title} dashboard
      </Link>
    </div>
  );
}
