import { NextResponse, type NextRequest } from 'next/server';
import { auth, authConfigured } from '@/lib/auth';

const protect = auth.middleware({ loginUrl: '/login' });
const SESSION_COOKIE = '__Secure-neon-auth.session_token';

export default async function proxy(request: NextRequest) {
  if (!authConfigured) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  const response = await protect(request);
  const location = response.headers.get('location');
  // A blip talking to Neon Auth used to bounce a signed-in player to /login
  // on the next header link. Keep the request when their session cookie is still here.
  if (request.cookies.has(SESSION_COOKIE) && location && new URL(location, request.url).pathname === '/login') {
    return NextResponse.next();
  }
  return response;
}

export const config = {
  matcher: ['/profile', '/profile/:path*', '/play', '/matches/:path*', '/history', '/home', '/people', '/notifications', '/moderation', '/admin'],
};
