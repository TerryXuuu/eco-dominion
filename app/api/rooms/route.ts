import { actorRoute } from '@/lib/api';
import { createRoom } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function POST(request: Request) {
  return actorRoute(request, (client, userId) => createRoom(client, userId), { mutation: true });
}
