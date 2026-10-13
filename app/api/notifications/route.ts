import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { markRead, notifications } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  const url = new URL(request.url);
  return actorRoute(
    request,
    (client, userId) => notifications(client, userId, { cursor: url.searchParams.get('cursor'), limit: url.searchParams.get('limit') }),
    { mutation: false },
  );
}

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Choose notifications to mark as read' }, 400);
  return actorRoute(request, (client, userId) => markRead(client, userId, body), { mutation: true });
}
