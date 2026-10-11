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
