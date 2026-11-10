import { redirect } from 'next/navigation';
import { notePresence, provisionActor, readActor } from './actor-cache';
import { AuthUnavailableError, currentIdentity } from './api';
import { withClient } from './db';
import { accountGate } from './profile-policy';
import type { AuthIdentity, Queryable } from './profile-service';

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
  const actor = readActor(signedIn) ?? await withClient((client) => provisionActor(client, signedIn));
  if (!accountGate(actor.status, false).ok) redirect('/login');
  const data = await withClient(async (client) => {
    await notePresence(client, actor.userId);
    return load(client, actor.userId, signedIn);
  });
  return { email: signedIn.email, userId: actor.userId, suspended: actor.status === 'suspended', data };
}
