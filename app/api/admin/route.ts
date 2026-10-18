import { actorRoute, jsonBody } from '@/lib/api';
import { adminAct, adminOverview } from '@/lib/admin-service';
import { privateJson } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') ?? '';
  return actorRoute(request, (client, userId) => adminOverview(client, userId, query), { mutation: false });
}

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Give a reason of 3–500 characters' }, 400);
  return actorRoute(request, (client, userId) => adminAct(client, userId, body), { mutation: true });
}
