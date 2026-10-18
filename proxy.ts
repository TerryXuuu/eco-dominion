import { NextResponse, type NextRequest } from 'next/server';
import { auth, authConfigured } from '@/lib/auth';

const protect = auth.middleware({ loginUrl: '/login' });

export default function proxy(request: NextRequest) {
  if (!authConfigured) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return protect(request);
}

export const config = {
  matcher: ['/profile', '/profile/:path*', '/play', '/matches/:path*', '/history', '/community', '/community/:path*', '/people', '/notifications', '/moderation', '/admin'],
};
