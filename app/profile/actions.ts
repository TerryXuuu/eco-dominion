'use server';

import { redirect } from 'next/navigation';
import { auth, authConfigured } from '@/lib/auth';

export async function signOut() {
  if (authConfigured) await auth.signOut();
  redirect('/');
}
