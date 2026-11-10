import { provisionActor, readActor } from '@/lib/actor-cache';
import { currentIdentity } from '@/lib/api';
import { auth, authConfigured, toIdentity } from '@/lib/auth';
import { withClient, withTransaction } from '@/lib/db';
import { privateJson } from '@/lib/http';
import { sameOrigin } from '@/lib/profile-policy';
import { provisionUser } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 1_500_000;
const AVATAR_TTL_MS = 5 * 60_000;
const ownAvatar = new Map<string, { at: number; mime: string; bytes: Uint8Array } | { at: number; missing: true }>();

async function owner() {
  if (!authConfigured) return null;
  const { data } = await auth.getSession();
  if (!data?.user?.email) return null;
  return toIdentity(data.user);
}

export async function GET() {
  let identity;
  try {
    identity = await currentIdentity();
  } catch {
    return privateJson({ error: 'Unauthorized' }, 401);
  }
  if (!identity) return privateJson({ error: 'Unauthorized' }, 401);
  const remembered = ownAvatar.get(identity.subject);
  if (remembered && Date.now() - remembered.at < AVATAR_TTL_MS) {
    if ('missing' in remembered) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(remembered.bytes), { headers: { 'content-type': remembered.mime, 'cache-control': 'private, max-age=300' } });
  }
  const row = await withClient(async (client) => {
    const actor = readActor(identity) ?? await provisionActor(client, identity);
    const found = await client.query(`SELECT mime, bytes FROM profile_avatar WHERE user_id = $1`, [actor.userId]);
    return found.rows[0] ?? null;
  });
  if (!row) {
    ownAvatar.set(identity.subject, { at: Date.now(), missing: true });
    return new Response(null, { status: 404 });
  }
  const bytes = row.bytes as Uint8Array;
  const mime = String(row.mime);
  ownAvatar.set(identity.subject, { at: Date.now(), mime, bytes });
  return new Response(new Uint8Array(bytes), { headers: { 'content-type': mime, 'cache-control': 'private, max-age=300' } });
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
    ownAvatar.delete(identity.subject);
  });
  return privateJson({ ok: true }, 200);
}
