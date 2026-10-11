'use server';

import { redirect } from 'next/navigation';
import { auth, authConfigured } from '@/lib/auth';

export async function signIn(_state: { error: string } | null, formData: FormData) {
  if (!authConfigured) return { error: 'Authentication is not configured' };
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const { error } = await auth.signIn.email({ email, password });
  if (error) return { error: 'Email or password is incorrect' };
  redirect('/profile');
}
