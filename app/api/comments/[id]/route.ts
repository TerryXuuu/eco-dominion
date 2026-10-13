import { actorRoute } from '@/lib/api';
import { deleteComment } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return actorRoute(request, (client, userId) => deleteComment(client, userId, id), { mutation: true });
}
