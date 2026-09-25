import { cookies } from 'next/headers';
import { decodeToken } from '@agrosaathi/auth';
import { Card } from '@agrosaathi/ui';

export default function FarmerDashboard() {
  const rawToken = cookies().get('agrosaathi-token')?.value;
  const user = decodeToken(rawToken) || { sub: 'demo-farmer', role: 'FARMER', kisaan_id: 'IN-DEMO1234' };

  return (
    <main style={{ maxWidth: 980, margin: '40px auto', padding: 24 }}>
      <h1>Farmer Dashboard</h1>
      <p>Authenticated as {user.role}.</p>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <Card title="Profile">
          <p><strong>Name:</strong> Demo Farmer</p>
          <p><strong>Kisaan ID:</strong> {user.kisaan_id || 'N/A'}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </Card>

        <Card title="Farm overview">
          <p>Land records: Verified</p>
          <p>Current crop: Paddy</p>
          <p>Residue cycle: Active</p>
        </Card>
      </div>
    </main>
  );
}
