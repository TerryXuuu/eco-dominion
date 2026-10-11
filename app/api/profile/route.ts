import { auth, authConfigured, toIdentity } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { privateJson } from '@/lib/http';
import { sameOrigin } from '@/lib/profile-policy';
import { getOwnProfile, updateOwnProfile } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (!authConfigured) return privateJson({ error: 'Unauthorized' }, 401);
  try {
    const { data } = await auth.getSession();
    if (!data?.user?.email) return privateJson({ error: 'Unauthorized' }, 401);
    const result = await withTransaction((client) => getOwnProfile(client, toIdentity(data.user)));
    return privateJson(result.body, result.status);
  } catch {
    return privateJson({ error: 'Unauthorized' }, 401);
  }
}

export async function PATCH(request: Request) {
  if (!authConfigured) return privateJson({ error: 'Unauthorized' }, 401);
  if (!sameOrigin(request)) return privateJson({ error: 'Forbidden' }, 403);
  try {
    const { data } = await auth.getSession();
    if (!data?.user?.email) return privateJson({ error: 'Unauthorized' }, 401);
    const body = await request.json();
    const result = await withTransaction((client) => updateOwnProfile(client, toIdentity(data.user), body, true));
    return privateJson(result.body, result.status);
  } catch {
    return privateJson({ error: 'Unable to save profile' }, 400);
  }
}
