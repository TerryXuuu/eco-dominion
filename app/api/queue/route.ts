import { actorRoute } from '@/lib/api';
import { enterQueue, leaveQueue, queueStatus } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  return actorRoute(request, (client, userId) => queueStatus(client, userId, Date.now()), { mutation: false });
}

export function POST(request: Request) {
  return actorRoute(request, (client, userId) => enterQueue(client, userId, Date.now()), { mutation: true });
}

export function DELETE(request: Request) {
  return actorRoute(request, (client, userId) => leaveQueue(client, userId), { mutation: true });
}
