import { cookies } from 'next/headers';
import { decodeToken } from '@agrosaathi/auth';
import { Card } from '@agrosaathi/ui';

export default function BuyerDashboard() {
  const rawToken = cookies().get('agrosaathi-token')?.value;
  const user = decodeToken(rawToken) || { sub: 'demo-buyer', role: 'BUYER', org_id: 'COMP-XYZ123' };

  return (
    <main style={{ maxWidth: 980, margin: '40px auto', padding: 24 }}>
      <h1>Buyer Dashboard</h1>
      <p>Authenticated as {user.role}.</p>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <Card title="Company profile">
          <p><strong>Org ID:</strong> {user.org_id || 'Not linked yet'}</p>
          <p><strong>Access:</strong> Company-verified</p>
        </Card>

        <Card title="Opportunity feed">
          <p>2 active residue purchase requests</p>
          <p>3 pending procurement orders</p>
        </Card>
      </div>
    </main>
  );
}
