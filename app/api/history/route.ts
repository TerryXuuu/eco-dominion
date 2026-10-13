import { actorRoute } from '@/lib/api';
import { history } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  return actorRoute(request, (client, userId) => history(client, userId), { mutation: false });
}
