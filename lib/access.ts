import type { Queryable } from './profile-service.ts';

/** Stand-in viewer for a signed-out reader. It matches no account, so only public posts are visible. */
export const PUBLIC_READER = '00000000-0000-0000-0000-000000000000';

/** Guests may read the leaderboard and community. Playing and posting need player or admin. */
export async function participationGate(client: Queryable, userId: string) {
  const found = await client.query(`SELECT role FROM user_role WHERE user_id = $1`, [userId]);
  const roles = found.rows.map((row) => String(row.role));
  if (roles.includes('guest') && !roles.includes('player') && !roles.includes('admin')) {
    return { ok: false as const, error: 'Guests can read the leaderboard and community, but cannot play or post' };
  }
  return { ok: true as const };
}
