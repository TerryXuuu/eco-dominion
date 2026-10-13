'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, authConfigured, settleAuth } from '@/lib/auth';

const AUTH_COOKIE_PREFIX = '__Secure-neon-auth';

export async function signOut() {
  if (authConfigured) await settleAuth('sign-out', () => auth.signOut());
  // Local cookies must go even when upstream revocation fails, or the cached session_data keeps the user signed in.
  const jar = await cookies();
  for (const { name } of jar.getAll()) {
    if (name.startsWith(AUTH_COOKIE_PREFIX)) jar.set(name, '', { maxAge: 0, path: '/', secure: true, httpOnly: true, sameSite: 'lax' });
  }
  redirect('/');
}
