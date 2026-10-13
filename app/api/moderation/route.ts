import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { moderate, moderationQueue } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  const url = new URL(request.url);
  return actorRoute(request, (client, userId) => moderationQueue(client, userId, { status: url.searchParams.get('status') }), { mutation: false });
}

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Choose an action and give a reason of 3–500 characters' }, 400);
  return actorRoute(request, (client, userId) => moderate(client, userId, body), { mutation: true });
}
