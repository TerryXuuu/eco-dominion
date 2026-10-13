import { actorRoute } from '@/lib/api';
import { feed } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  const url = new URL(request.url);
  return actorRoute(
    request,
    (client, userId) => feed(client, userId, { cursor: url.searchParams.get('cursor'), limit: url.searchParams.get('limit'), scope: url.searchParams.get('scope') }),
    { mutation: false },
  );
}
