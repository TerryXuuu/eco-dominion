import { currentIdentity } from '@/lib/api';
import { withClient } from '@/lib/db';
import { privateJson } from '@/lib/http';
import { viewProfile } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ handle: string }> }) {
  const { handle } = await context.params;
  try {
    const viewer = await currentIdentity();
    const result = await withClient((client) => viewProfile(client, viewer, handle));
    return privateJson(result.body, result.status);
  } catch {
    return privateJson({ error: 'Not found' }, 404);
  }
}
