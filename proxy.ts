import { NextResponse, type NextRequest } from 'next/server';
import { auth, authConfigured } from '@/lib/auth';

const protect = auth.middleware({ loginUrl: '/login' });
const SESSION_COOKIES = ['__Secure-neon-auth.session_token', 'neon-auth.session_token'];

export default async function proxy(request: NextRequest) {
  if (!authConfigured) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  // The session cookie is enough to let the page through. Calling Neon Auth
  // here made every header tab wait on a network round trip before rendering.
  if (SESSION_COOKIES.some((name) => request.cookies.has(name))) return NextResponse.next();
  return protect(request);
}

export const config = {
  matcher: ['/profile', '/profile/:path*', '/settings', '/friends', '/play', '/matches/:path*', '/history', '/home', '/people', '/notifications', '/moderation', '/admin'],
};
