import { privateJson } from '@/lib/http';
import { cachedLeaderboard } from '@/lib/leaderboard-cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await cachedLeaderboard();
    return privateJson(result.body, result.status);
  } catch {
    return privateJson({ error: 'Something went wrong; try again' }, 500);
  }
}
