import { actorRoute } from '@/lib/api';
import { startPractice } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function POST(request: Request) {
  return actorRoute(request, (client, userId) => startPractice(client, userId, Date.now()), { mutation: true });
}
