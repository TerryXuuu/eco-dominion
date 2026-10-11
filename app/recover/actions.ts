'use server';

import { auth, authConfigured } from '@/lib/auth';
import { runtimeEnv } from '@/lib/config';

export async function requestReset(_state: { error?: string; message?: string } | null, formData: FormData) {
  if (!authConfigured) return { error: 'Authentication is not configured' };
  const email = String(formData.get('email') ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  const { appUrl } = runtimeEnv();
  const { error } = await auth.requestPasswordReset({
    email,
    redirectTo: `${appUrl}/reset-password`,
  });
  if (error) return { error: 'Unable to request recovery right now.' };
  return { message: 'If an account exists for that email, a recovery message has been requested.' };
}
