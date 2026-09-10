import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { JWT_SECRET_KEY } from '@/lib/constants';

const ROLE_ROUTES: Record<string, string> = {
  manufacturer: '/manufacturer',
  distributor: '/distributor',
  retailer: '/retailer',
  disposer: '/disposer',
  host: '/host',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Redirect /dashboard to role-specific portal if logged in
  if (pathname === '/dashboard') {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
      const role = payload.role as string;
      return NextResponse.redirect(new URL(ROLE_ROUTES[role] || '/login', request.url));
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect role portals
  const protectedPrefixes = ['/manufacturer', '/distributor', '/retailer', '/disposer', '/host'];
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  // No token → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    const role = payload.role as string;
    const allowedPrefix = ROLE_ROUTES[role];

    // Wrong role → redirect to their own portal
    if (!pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(allowedPrefix, request.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: ['/dashboard', '/manufacturer/:path*', '/distributor/:path*', '/retailer/:path*', '/disposer/:path*', '/host/:path*'],
};
