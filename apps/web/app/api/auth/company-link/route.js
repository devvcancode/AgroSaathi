import { NextResponse } from 'next/server';
import { decodeToken, mockVerifyCompany, buildToken } from '@agrosaathi/auth';

export async function POST(request) {
  const body = await request.json();
  const existingToken = request.cookies.get('agrosaathi-token')?.value;
  const decoded = decodeToken(existingToken);

  if (!decoded) {
    return NextResponse.json({ ok: false, message: 'Login first to link a company.' }, { status: 401 });
  }

  const result = mockVerifyCompany({ companyId: body.companyId });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status || 400 });
  }

  const token = buildToken({
    sub: decoded.sub,
    role: 'BUYER',
    org_id: result.orgId,
    email: decoded.email || 'buyer@example.com'
  });

  const response = NextResponse.json({
    ok: true,
    message: 'Company linked successfully.',
    redirect: '/buyer'
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
