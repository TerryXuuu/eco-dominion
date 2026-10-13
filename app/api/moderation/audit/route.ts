import { actorRoute } from '@/lib/api';
import { auditTrail } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  return actorRoute(request, (client, userId) => auditTrail(client, userId), { mutation: false });
}
