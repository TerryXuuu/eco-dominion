import { actorRoute } from '@/lib/api';
import { replay } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const step = new URL(request.url).searchParams.get('step');
  return actorRoute(request, (client, userId) => replay(client, userId, id, step ?? undefined), { mutation: false });
}
