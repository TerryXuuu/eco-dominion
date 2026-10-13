import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { addComment } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Write a comment of 1–1000 characters' }, 400);
  return actorRoute(request, (client, userId) => addComment(client, userId, id, body), { mutation: true });
}
