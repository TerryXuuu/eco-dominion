import { currentIdentity } from '@/lib/api';
import { PUBLIC_READER } from '@/lib/access';
import { readPostImage } from '@/lib/community-service';
import { withTransaction } from '@/lib/db';
import { provisionUser } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string; imageId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id, imageId } = await params;
  const identity = await currentIdentity().catch(() => null);
  const row = await withTransaction(async (client) => {
    const viewer = identity ? (await provisionUser(client, identity)).user_id : PUBLIC_READER;
    return readPostImage(client, viewer, id, imageId);
  });
  if (!row) return new Response(null, { status: 404 });
  const bytes = row.bytes as Uint8Array;
  return new Response(new Uint8Array(bytes), {
    headers: { 'content-type': String(row.mime), 'cache-control': 'private, max-age=300' },
  });
}
