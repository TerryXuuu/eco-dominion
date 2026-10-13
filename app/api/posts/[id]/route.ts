import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { deletePost, getPost, updatePost } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  return actorRoute(request, (client, userId) => getPost(client, userId, id), { mutation: false });
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Write 1–2000 characters and choose who can see it' }, 400);
  return actorRoute(request, (client, userId) => updatePost(client, userId, id, body), { mutation: true });
}

export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  return actorRoute(request, (client, userId) => deletePost(client, userId, id), { mutation: true });
}
