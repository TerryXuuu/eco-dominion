import { withTransaction } from '@/lib/db';
import { privateJson } from '@/lib/http';
import { leaderboard } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await withTransaction((client) => leaderboard(client));
    return privateJson(result.body, result.status);
  } catch {
    return privateJson({ error: 'Something went wrong; try again' }, 500);
  }
}
