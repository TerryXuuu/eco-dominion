import { auth, authConfigured, toIdentity } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { privateJson } from '@/lib/http';
import { viewProfile } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ handle: string }> }) {
  if (!authConfigured) return privateJson({ error: 'Not found' }, 404);
  const { handle } = await context.params;
  try {
    const { data } = await auth.getSession();
    const viewer = data?.user?.email ? toIdentity(data.user) : null;
    const result = await withTransaction((client) => viewProfile(client, viewer, handle));
    return privateJson(result.body, result.status);
  } catch {
    return privateJson({ error: 'Not found' }, 404);
  }
}
