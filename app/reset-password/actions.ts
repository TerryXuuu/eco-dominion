'use server';

import { redirect } from 'next/navigation';
import { auth, authConfigured } from '@/lib/auth';

export async function resetPassword(_state: { error: string } | null, formData: FormData) {
  if (!authConfigured) return { error: 'Authentication is not configured' };
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  if (!token || password.length < 8) return { error: 'A recovery token and a password of 8 or more characters are required.' };
  const { error } = await auth.resetPassword({ newPassword: password, token });
  if (error) return { error: 'Unable to reset the password.' };
  redirect('/login');
}
