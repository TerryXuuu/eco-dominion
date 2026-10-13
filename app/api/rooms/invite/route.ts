import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { inviteToRoom } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Open a private room before inviting' }, 400);
  return actorRoute(request, (client, userId) => inviteToRoom(client, userId, body), { mutation: true });
}
