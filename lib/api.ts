import { cache } from 'react';
import { cookies } from 'next/headers';
import { auth, authConfigured, toIdentity } from './auth';
import { withTransaction } from './db';
import { privateJson } from './http';
import { accountGate, sameOrigin } from './profile-policy';
import { provisionUser, type AuthIdentity, type Queryable } from './profile-service';

type Handler = (client: Queryable, userId: string) => Promise<{ status: number; body: unknown }>;

/** The auth provider could not be reached; the caller is not known to be signed out. */
export class AuthUnavailableError extends Error {}

const SESSION_ATTEMPTS = 3;
const SESSION_TTL_MS = 20_000;
const remembered = new Map<string, { at: number; identity: AuthIdentity | null }>();

function sessionToken(jar: Awaited<ReturnType<typeof cookies>>) {
  return jar.get('__Secure-neon-auth.session_token')?.value ?? jar.get('neon-auth.session_token')?.value ?? '';
}

async function lookupIdentity(): Promise<AuthIdentity | null> {
  if (!authConfigured) return null;
  let failure: unknown = null;
  for (let attempt = 0; attempt < SESSION_ATTEMPTS; attempt += 1) {
    try {
      const { data, error } = await auth.getSession();
      if (data?.user?.email) return toIdentity(data.user);
      const status = Number((error as { status?: unknown } | null)?.status);
      if (!error || (status >= 400 && status < 500)) return null;
      failure = error;
    } catch (error) {
      failure = error;
    }
  }
  console.error('[auth] session lookup failed', failure);
  throw new AuthUnavailableError('Authentication service unreachable');
}

/** One session read per request, and a short memory of it so header tabs do not call Neon Auth on every click. */
export const currentIdentity = cache(async (): Promise<AuthIdentity | null> => {
  let token = '';
  try {
    token = sessionToken(await cookies());
  } catch {
    token = '';
  }
  const key = token || 'anonymous';
  const hit = remembered.get(key);
  if (hit && Date.now() - hit.at < SESSION_TTL_MS) return hit.identity;
  const identity = await lookupIdentity();
  remembered.set(key, { at: Date.now(), identity });
  if (remembered.size > 100) {
    const oldest = remembered.keys().next().value;
    if (oldest) remembered.delete(oldest);
  }
  return identity;
});

export function forgetSession(token: string) {
  if (token) remembered.delete(token);
}

/** Authenticates, maps the provider subject to app_user and runs the handler inside one request-scoped transaction. */
export async function actorRoute(request: Request, handler: Handler, options: { mutation: boolean }) {
  if (options.mutation && !sameOrigin(request)) return privateJson({ error: 'Forbidden' }, 403);
  let identity: AuthIdentity | null;
  try {
    identity = await currentIdentity();
  } catch (error) {
    if (error instanceof AuthUnavailableError) return privateJson({ error: 'Sign-in service unreachable; try again' }, 503);
    throw error;
  }
  if (!identity) return privateJson({ error: 'Unauthorized' }, 401);
  try {
    const result = await withTransaction(async (client) => {
      const user = await provisionUser(client, identity);
      const gate = accountGate(user.status, options.mutation);
      if (!gate.ok) return { status: 403, body: { error: gate.error } };
      return handler(client, user.user_id);
    });
    return privateJson(result.body, result.status);
  } catch (error) {
    console.error('[api] request failed', error);
    return privateJson({ error: 'Something went wrong; try again' }, 500);
  }
}

export async function jsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > 4096) return null;
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}
