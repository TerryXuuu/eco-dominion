import { auth, authConfigured, toIdentity } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { privateJson } from '@/lib/http';
import { sameOrigin } from '@/lib/profile-policy';
import { provisionUser } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 1_500_000;

async function owner() {
  if (!authConfigured) return null;
  const { data } = await auth.getSession();
  if (!data?.user?.email) return null;
  return toIdentity(data.user);
}

export async function GET() {
  const identity = await owner();
  if (!identity) return privateJson({ error: 'Unauthorized' }, 401);
  const row = await withTransaction(async (client) => {
    const user = await provisionUser(client, identity);
    const found = await client.query(`SELECT mime, bytes FROM profile_avatar WHERE user_id = $1`, [user.user_id]);
    return found.rows[0] ?? null;
  });
  if (!row) return new Response(null, { status: 404 });
  const bytes = row.bytes as Uint8Array;
  return new Response(new Uint8Array(bytes), { headers: { 'content-type': String(row.mime), 'cache-control': 'private, max-age=60' } });
}

export async function POST(request: Request) {
  const identity = await owner();
  if (!identity) return privateJson({ error: 'Unauthorized' }, 401);
  if (!sameOrigin(request)) return privateJson({ error: 'Forbidden' }, 403);
  const form = await request.formData();
  const file = form.get('avatar');
  if (!(file instanceof File)) return privateJson({ error: 'Choose an image file' }, 400);
  if (!TYPES.has(file.type)) return privateJson({ error: 'Use a JPEG, PNG, WebP, or GIF' }, 400);
  if (file.size > MAX_BYTES) return privateJson({ error: 'Image must be 1.5 MB or smaller' }, 400);
  const bytes = Buffer.from(await file.arrayBuffer());
  await withTransaction(async (client) => {
    const user = await provisionUser(client, identity);
    await client.query(
      `INSERT INTO profile_avatar (user_id, mime, bytes) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET mime = EXCLUDED.mime, bytes = EXCLUDED.bytes, updated_at = now()`,
      [user.user_id, file.type, bytes],
    );
    await client.query(`UPDATE profile SET avatar_key = 'local' WHERE user_id = $1`, [user.user_id]);
  });
  return privateJson({ ok: true }, 200);
}
