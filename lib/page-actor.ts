import { redirect } from 'next/navigation';
import { currentIdentity } from './api';
import { withTransaction } from './db';
import { accountGate } from './profile-policy';
import { provisionUser, type AuthIdentity, type Queryable } from './profile-service';

const knownActors = new Map<string, { at: number; userId: string; status: string }>();
const ACTOR_TTL_MS = 20_000;

/** Server-component guard: a signed-in, provisioned user (suspended users may read) or a redirect to login. */
export async function pageActor<T>(load: (client: Queryable, userId: string, identity: AuthIdentity) => Promise<T>) {
  const identity = await currentIdentity();
  if (!identity) redirect('/login');
  const result = await withTransaction(async (client) => {
    let known = knownActors.get(identity.subject);
    if (!known || Date.now() - known.at >= ACTOR_TTL_MS) {
      const user = await provisionUser(client, identity);
      known = { at: Date.now(), userId: user.user_id, status: user.status };
      knownActors.set(identity.subject, known);
    }
    if (!accountGate(known.status, false).ok) return null;
    return { userId: known.userId, suspended: known.status === 'suspended', data: await load(client, known.userId, identity) };
  });
  if (!result) redirect('/login');
  return { email: identity.email, ...result };
}
