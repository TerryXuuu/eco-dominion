import { actorRoute, jsonBody } from '@/lib/api';
import { privateJson } from '@/lib/http';
import { createPost } from '@/lib/community-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 1_500_000;

async function attachedImages(form: FormData) {
  const files = form.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length > 3) return { error: 'Attach at most 3 images' as const };
  const images: { mime: string; bytes: Buffer }[] = [];
  for (const file of files) {
    if (!IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
      return { error: 'Each image must be a JPEG, PNG, WebP, or GIF under 1.5 MB' as const };
    }
    images.push({ mime: file.type, bytes: Buffer.from(await file.arrayBuffer()) });
  }
  return { images };
}

export async function POST(request: Request) {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('multipart/form-data')) {
    const form = await request.formData();
    const files = await attachedImages(form);
    if (files.error) return privateJson({ error: files.error }, 400);
    const input = { body: form.get('body'), visibility: form.get('visibility') || 'public', tags: form.get('tags') ?? '' };
    return actorRoute(request, (client, userId) => createPost(client, userId, input, files.images), { mutation: true });
  }
  const body = await jsonBody(request);
  if (!body) return privateJson({ error: 'Write 1–2000 characters and choose who can see it' }, 400);
  return actorRoute(request, (client, userId) => createPost(client, userId, body), { mutation: true });
}
