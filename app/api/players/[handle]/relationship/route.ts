import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { changeRelationship, getRelationship } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ handle: string }> };

export async function GET(request: Request, { params }: Context) {
  const { handle } = await params;
  return actorRoute(request, (client, userId) => getRelationship(client, userId, handle), { mutation: false });
}

export async function POST(request: Request, { params }: Context) {
  const { handle } = await params;
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Unknown action' }, 400);
  return actorRoute(request, (client, userId) => changeRelationship(client, userId, handle, body), { mutation: true });
}
