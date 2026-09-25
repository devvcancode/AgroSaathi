import { NextResponse } from 'next/server';
import { decodeToken } from '@agrosaathi/auth';

const ROLE_PATHS = {
  FARMER: '/farmer',
  BUYER: '/buyer',
  SELLER: '/seller',
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' || pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('agrosaathi-token')?.value;
  const decoded = decodeToken(token);

  if (!decoded) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = decoded.role;

  if (pathname.startsWith('/farmer') && role !== 'FARMER') {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  if (pathname.startsWith('/buyer') && role !== 'BUYER') {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  if (pathname.startsWith('/seller') && role !== 'SELLER') {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  if (pathname.startsWith('/buyer') && !decoded.org_id) {
    return NextResponse.redirect(new URL('/buyer/link-company', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/farmer/:path*', '/buyer/:path*', '/seller/:path*'],
};
