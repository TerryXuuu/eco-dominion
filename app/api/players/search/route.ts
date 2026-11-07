import { actorRoute } from '@/lib/api';
import { searchPlayers } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') ?? '';
  return actorRoute(request, (client, userId) => searchPlayers(client, userId, query), { mutation: false });
}
