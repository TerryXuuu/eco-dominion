import { actorRoute } from '@/lib/api';
import { listRoomInvites } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  return actorRoute(request, (client, userId) => listRoomInvites(client, userId), { mutation: false });
}
