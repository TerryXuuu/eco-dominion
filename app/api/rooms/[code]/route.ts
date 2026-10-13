import { actorRoute } from '@/lib/api';
import { cancelRoom, getRoom } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: Context) {
  const { code } = await params;
  return actorRoute(request, (client, userId) => getRoom(client, userId, code), { mutation: false });
}

export async function DELETE(request: Request, { params }: Context) {
  const { code } = await params;
  return actorRoute(request, (client, userId) => cancelRoom(client, userId, code), { mutation: true });
}
