'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { forgetSession } from '@/lib/api';
import { auth, authConfigured, settleAuth } from '@/lib/auth';

const AUTH_COOKIE_PREFIX = '__Secure-neon-auth';

export async function signOut() {
  const jar = await cookies();
  forgetSession(jar.get('__Secure-neon-auth.session_token')?.value ?? jar.get('neon-auth.session_token')?.value ?? '');
  if (authConfigured) await settleAuth('sign-out', () => auth.signOut());
  // Local cookies must go even when upstream revocation fails, or the cached session_data keeps the user signed in.
  for (const { name } of jar.getAll()) {
    if (name.startsWith(AUTH_COOKIE_PREFIX)) jar.set(name, '', { maxAge: 0, path: '/', secure: true, httpOnly: true, sameSite: 'lax' });
  }
  redirect('/');
}
