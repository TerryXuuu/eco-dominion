import { redirect } from 'next/navigation';
import { AuthUnavailableError, currentIdentity } from './api';
import { withClient } from './db';
import { accountGate } from './profile-policy';
import { provisionUser, type AuthIdentity, type Queryable } from './profile-service';
import { touchPresence } from './presence';

const knownActors = new Map<string, { at: number; userId: string; status: string }>();
const ACTOR_TTL_MS = 60_000;

/** Server-component guard: a signed-in, provisioned user (suspended users may read) or a redirect to login. */
export async function pageActor<T>(load: (client: Queryable, userId: string, identity: AuthIdentity) => Promise<T>) {
  let identity: AuthIdentity | null;
  try {
    identity = await currentIdentity();
  } catch (error) {
    if (error instanceof AuthUnavailableError) redirect('/login');
    throw error;
  }
  if (!identity) redirect('/login');
  const signedIn = identity;
  const hit = knownActors.get(signedIn.subject);
  const known = hit && Date.now() - hit.at < ACTOR_TTL_MS ? hit : null;
  const actor = known ?? await withClient(async (client) => {
    const user = await provisionUser(client, signedIn);
    const fresh = { at: Date.now(), userId: user.user_id, status: user.status };
    knownActors.set(signedIn.subject, fresh);
    return fresh;
  });
  if (!accountGate(actor.status, false).ok) redirect('/login');
  const [data] = await Promise.all([
    withClient((client) => load(client, actor.userId, signedIn)),
    withClient((client) => touchPresence(client, actor.userId)),
  ]);
  return { email: signedIn.email, userId: actor.userId, suspended: actor.status === 'suspended', data };
}
