import { cookies } from 'next/headers';
import { decodeToken } from '@agrosaathi/auth';
import { Card } from '@agrosaathi/ui';

export default function SellerDashboard() {
  const rawToken = cookies().get('agrosaathi-token')?.value;
  const user = decodeToken(rawToken) || { sub: 'demo-seller', role: 'SELLER' };

  return (
    <main style={{ maxWidth: 980, margin: '40px auto', padding: 24 }}>
      <h1>Seller Dashboard</h1>
      <p>Authenticated as {user.role}.</p>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <Card title="Inventory">
          <p>20 tons of harvested biomass</p>
          <p>5 open listings</p>
        </Card>

        <Card title="Marketplace">
          <p>Buyer inquiries: 7</p>
          <p>Dispatch status: Ready</p>
        </Card>
      </div>
    </main>
  );
}
