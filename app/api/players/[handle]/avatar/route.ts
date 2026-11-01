import { withTransaction } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ handle: string }> }) {
  const { handle } = await context.params;
  if (!/^[a-z0-9_]{3,24}$/i.test(handle)) return new Response(null, { status: 404 });
  const row = await withTransaction(async (client) => {
    const found = await client.query(
      `SELECT a.mime, a.bytes
       FROM profile_avatar a
       JOIN app_user u ON u.id = a.user_id
       WHERE lower(u.handle) = lower($1) AND u.status <> 'deleted'`,
      [handle],
    );
    return found.rows[0] ?? null;
  });
  if (!row) return new Response(null, { status: 404 });
  const bytes = row.bytes as Uint8Array;
  return new Response(new Uint8Array(bytes), {
    headers: { 'content-type': String(row.mime), 'cache-control': 'public, max-age=60' },
  });
}
