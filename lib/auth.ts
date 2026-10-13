import { createNeonAuth } from '@neondatabase/auth/next/server';
import { runtimeEnv } from './config';

const env = runtimeEnv();

/** Build can import this module before local Neon credentials exist. Actions refuse work while authConfigured is false. */
export const auth = createNeonAuth({
  baseUrl: env.baseUrl || 'https://example.invalid/auth',
  cookies: {
    secret: env.secret.length >= 32 ? env.secret : 'build-only-placeholder-secret-32chars!!',
  },
});

export const authConfigured = env.configured;

/** Upstream auth calls can throw on network failure instead of returning { error }; forms must still get a response. */
export async function settleAuth<T extends { error?: unknown }>(label: string, call: () => Promise<T>) {
  try {
    return await call();
  } catch (error) {
    console.error(`[auth] ${label} failed`, error);
    return { error: { message: 'Authentication service unreachable' } };
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
};

export function toIdentity(user: SessionUser) {
  return {
    subject: user.id,
    email: user.email,
    name: user.name?.trim() || '',
    emailVerified: Boolean(user.emailVerified),
  };
}
