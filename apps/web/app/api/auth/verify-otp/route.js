import { NextResponse } from 'next/server';
import { buildToken } from '@agrosaathi/auth';

export async function POST(request) {
  const body = await request.json();
  const otp = String(body.otp || '').trim();
  const role = String(body.role || 'farmer').toUpperCase();

  if (otp !== '123456') {
    return NextResponse.json({ ok: false, message: 'Invalid OTP. Use 123456 in mock mode.' }, { status: 400 });
  }

  const payload = {
    sub: `${body.kisaanId || 'demo'}-${body.mobile || '0000000000'}`,
    role: role === 'BUYER' ? 'BUYER' : role === 'SELLER' ? 'SELLER' : 'FARMER',
    kisaan_id: body.kisaanId || 'IN-DEMO1234',
    org_id: body.orgId || undefined,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 15
  };

  const token = buildToken({
    sub: payload.sub,
    role: payload.role,
    kisaan_id: payload.kisaan_id,
    org_id: payload.org_id,
    email: `${body.kisaanId || 'demo'}@example.gov.in`
  });

  const response = NextResponse.json({
    ok: true,
    message: 'OTP verified and JWT issued.',
    redirect: role === 'BUYER' ? '/buyer' : role === 'SELLER' ? '/seller' : '/farmer'
  });

  response.cookies.set('agrosaathi-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 15
  });

  return response;
}
