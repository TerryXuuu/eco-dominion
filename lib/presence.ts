import type { Queryable } from './profile-service.ts';

const ONLINE_MS = 3 * 60 * 1000;

export function isOnline(lastSeen: unknown, now = Date.now()) {
  if (!lastSeen) return false;
  const at = new Date(String(lastSeen)).getTime();
  return Number.isFinite(at) && now - at < ONLINE_MS;
}

/** Refresh presence at most every 45 seconds so a quiet page still counts as online. */
export async function touchPresence(client: Queryable, userId: string) {
  await client.query(
    `UPDATE app_user SET last_seen = now() WHERE id = $1 AND (last_seen IS NULL OR last_seen < now() - interval '45 seconds')`,
    [userId],
  );
}
