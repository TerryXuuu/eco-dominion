import { redirect } from 'next/navigation';
import { currentIdentity } from './api';
import { withTransaction } from './db';
import { provisionUser, type Queryable } from './profile-service';

/** Server-component guard: signed-in, provisioned, active user or a redirect to login. */
export async function pageActor<T>(load: (client: Queryable, userId: string) => Promise<T>) {
  const identity = await currentIdentity();
  if (!identity) redirect('/login');
  const result = await withTransaction(async (client) => {
    const user = await provisionUser(client, identity);
    if (user.status !== 'active') return null;
    return { userId: user.user_id, data: await load(client, user.user_id) };
  });
  if (!result) redirect('/login');
  return { email: identity.email, ...result };
}
