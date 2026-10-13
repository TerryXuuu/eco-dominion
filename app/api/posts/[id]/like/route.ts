import { actorRoute } from '@/lib/api';
import { setLike } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  return actorRoute(request, (client, userId) => setLike(client, userId, id, true), { mutation: true });
}

export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  return actorRoute(request, (client, userId) => setLike(client, userId, id, false), { mutation: true });
}
