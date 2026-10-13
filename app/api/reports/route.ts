import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { createReport } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Choose what to report and give a reason of 3–500 characters' }, 400);
  return actorRoute(request, (client, userId) => createReport(client, userId, body), { mutation: true });
}
