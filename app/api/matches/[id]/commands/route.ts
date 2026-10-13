import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { submitCommand } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Invalid command' }, 400);
  return actorRoute(request, (client, userId) => submitCommand(client, userId, id, body, Date.now()), { mutation: true });
}
