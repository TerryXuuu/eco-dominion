import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { joinRoom } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await jsonBody(request)) as { code?: unknown } | null;
  if (!body) return privateJson({ error: 'Invalid request' }, 400);
  return actorRoute(request, (client, userId) => joinRoom(client, userId, body.code, Date.now()), { mutation: true });
}
