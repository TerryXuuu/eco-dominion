import { withClient } from './db.ts';
import { leaderboard } from './match-service.ts';

const LADDER_TTL_MS = 30_000;
let ladderCache: { at: number; body: Awaited<ReturnType<typeof leaderboard>>['body'] } | null = null;

/** The public ladder barely moves, so pages and the API share one result for half a minute. */
export async function cachedLeaderboard() {
  if (ladderCache && Date.now() - ladderCache.at < LADDER_TTL_MS) return { status: 200 as const, body: ladderCache.body };
  const result = await withClient((client) => leaderboard(client));
  if (result.status === 200) ladderCache = { at: Date.now(), body: result.body };
  return result;
}
