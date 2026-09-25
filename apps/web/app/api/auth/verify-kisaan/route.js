import { NextResponse } from 'next/server';
import { mockVerifyKisaan } from '@agrosaathi/auth';

export async function POST(request) {
  const body = await request.json();
  const result = mockVerifyKisaan({
    kisaanId: body.kisaanId,
    mobile: body.mobile
  });

  return NextResponse.json(result, { status: result.status || 200 });
}
