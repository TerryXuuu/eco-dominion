import { provisionUser, type AuthIdentity, type Queryable } from './profile-service';
import { touchPresence } from './presence';

const ACTOR_TTL_MS = 60_000;
const PRESENCE_GAP_MS = 45_000;

type Actor = { at: number; userId: string; status: string; email: string };

const actors = new Map<string, Actor>();
const presenceAt = new Map<string, number>();

/** A provisioned account remembered for a minute, so clicks do not re-read the user row. */
export function readActor(identity: AuthIdentity): Actor | null {
  const hit = actors.get(identity.subject);
  if (!hit || Date.now() - hit.at >= ACTOR_TTL_MS) return null;
  if (hit.email !== identity.email.toLowerCase()) return null;
  return hit;
}

export async function provisionActor(client: Queryable, identity: AuthIdentity): Promise<Actor> {
  const user = await provisionUser(client, identity);
  const fresh = { at: Date.now(), userId: user.user_id, status: user.status, email: identity.email.toLowerCase() };
  actors.set(identity.subject, fresh);
  return fresh;
}

/** Skip the presence write when this process already touched the player in the last 45 seconds. */
export async function notePresence(client: Queryable, userId: string) {
  const at = presenceAt.get(userId) ?? 0;
  if (Date.now() - at < PRESENCE_GAP_MS) return;
  presenceAt.set(userId, Date.now());
  try {
    await touchPresence(client, userId);
  } catch (error) {
    presenceAt.delete(userId);
    throw error;
  }
}
