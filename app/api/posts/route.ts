import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { createPost } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Write 1–2000 characters and choose who can see it' }, 400);
  return actorRoute(request, (client, userId) => createPost(client, userId, body), { mutation: true });
}
