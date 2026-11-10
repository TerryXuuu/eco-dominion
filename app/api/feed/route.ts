import { actorRoute, AuthUnavailableError, currentIdentity } from '@/lib/api';
import { PUBLIC_READER } from '@/lib/access';
import { feed } from '@/lib/community-service';
import { withClient } from '@/lib/db';
import { privateJson } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = { cursor: url.searchParams.get('cursor'), limit: url.searchParams.get('limit'), scope: url.searchParams.get('scope'), q: url.searchParams.get('q') };
  let identity;
  try {
    identity = await currentIdentity();
  } catch (error) {
    if (error instanceof AuthUnavailableError) return privateJson({ error: 'Sign-in service unreachable; try again' }, 503);
    throw error;
  }
  if (!identity) {
    const result = await withClient((client) => feed(client, PUBLIC_READER, { cursor: query.cursor, limit: query.limit, q: query.q }));
    return privateJson(result.body, result.status);
  }
  return actorRoute(request, (client, userId) => feed(client, userId, query), { mutation: false });
}
