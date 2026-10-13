import { redirect } from 'next/navigation';
import { currentIdentity } from './api';
import { withTransaction } from './db';
import { accountGate } from './profile-policy';
import { provisionUser, type AuthIdentity, type Queryable } from './profile-service';

/** Server-component guard: a signed-in, provisioned user (suspended users may read) or a redirect to login. */
export async function pageActor<T>(load: (client: Queryable, userId: string, identity: AuthIdentity) => Promise<T>) {
  const identity = await currentIdentity();
  if (!identity) redirect('/login');
  const result = await withTransaction(async (client) => {
    const user = await provisionUser(client, identity);
    if (!accountGate(user.status, false).ok) return null;
    return { userId: user.user_id, suspended: user.status === 'suspended', data: await load(client, user.user_id, identity) };
  });
  if (!result) redirect('/login');
  return { email: identity.email, ...result };
}
