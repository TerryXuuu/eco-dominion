import { actorRoute } from '@/lib/api';
import { viewMatch } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const known = new URL(request.url).searchParams.get('v');
  const knownVersion = known !== null && /^\d{1,9}$/.test(known) ? Number(known) : undefined;
  return actorRoute(request, (client, userId) => viewMatch(client, userId, id, Date.now(), knownVersion), { mutation: false });
}
