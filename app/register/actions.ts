'use server';

import { redirect } from 'next/navigation';
import { auth, authConfigured, settleAuth } from '@/lib/auth';

export async function signUp(_state: { error: string } | null, formData: FormData) {
  if (!authConfigured) return { error: 'Authentication is not configured' };
  const email = String(formData.get('email') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 1 || name.length > 40 || password.length < 8) {
    return { error: 'Check the name, email, and password (8 or more characters).' };
  }
  const { error } = await settleAuth('sign-up', () => auth.signUp.email({ email, name, password }));
  if (error) return { error: 'Unable to create account. Try again shortly.' };
  redirect('/home');
}
