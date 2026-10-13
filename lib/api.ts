import { auth, authConfigured, toIdentity } from './auth';
import { withTransaction } from './db';
import { privateJson } from './http';
import { sameOrigin } from './profile-policy';
import { provisionUser, type AuthIdentity, type Queryable } from './profile-service';

type Handler = (client: Queryable, userId: string) => Promise<{ status: number; body: unknown }>;

/** The auth provider could not be reached; the caller is not known to be signed out. */
export class AuthUnavailableError extends Error {}

const SESSION_ATTEMPTS = 3;

export async function currentIdentity(): Promise<AuthIdentity | null> {
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
      if (user.status !== 'active') return { status: 403, body: { error: 'Forbidden' } };
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
