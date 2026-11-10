import { withClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AVATAR_TTL_MS = 5 * 60_000;
const portraits = new Map<string, { at: number; mime: string; bytes: Uint8Array } | { at: number; missing: true }>();

export async function GET(_request: Request, context: { params: Promise<{ handle: string }> }) {
  const { handle } = await context.params;
  if (!/^[a-z0-9_]{3,24}$/i.test(handle)) return new Response(null, { status: 404 });
  const key = handle.toLowerCase();
  const remembered = portraits.get(key);
  if (remembered && Date.now() - remembered.at < AVATAR_TTL_MS) {
    if ('missing' in remembered) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(remembered.bytes), { headers: { 'content-type': remembered.mime, 'cache-control': 'public, max-age=300' } });
  }
  const row = await withClient(async (client) => {
    const found = await client.query(
      `SELECT a.mime, a.bytes
       FROM profile_avatar a
       JOIN app_user u ON u.id = a.user_id
       WHERE lower(u.handle) = lower($1) AND u.status <> 'deleted'`,
      [handle],
    );
    return found.rows[0] ?? null;
  });
  if (!row) {
    portraits.set(key, { at: Date.now(), missing: true });
    return new Response(null, { status: 404 });
  }
  const bytes = row.bytes as Uint8Array;
  const mime = String(row.mime);
  portraits.set(key, { at: Date.now(), mime, bytes });
  return new Response(new Uint8Array(bytes), { headers: { 'content-type': mime, 'cache-control': 'public, max-age=300' } });
}
