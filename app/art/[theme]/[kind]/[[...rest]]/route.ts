import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { ART_VARIANTS, CARD_FILE, THEMES, type ArtVariant, type Theme } from '@/lib/artwork';

const ROOT = path.join(process.cwd(), 'artworks');

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function firstPng(dir: string) {
  try {
    const names = (await readdir(dir)).filter((name) => name.toLowerCase().endsWith('.png')).sort();
    return names[0] ? path.join(dir, names[0]) : null;
  } catch {
    return null;
  }
}

async function variantFile(theme: Theme, folder: 'logo' | 'cards', variant: ArtVariant, fileName: string) {
  const direct = path.join(ROOT, theme, folder, variant, fileName);
  if (await exists(direct)) return direct;
  if (variant === 'cn') return null;
  const fallback = path.join(ROOT, theme, folder, 'cn', fileName);
  return (await exists(fallback)) ? fallback : null;
}

async function resolveArt(theme: string, kind: string, rest: string[] | undefined) {
  if (!THEMES.includes(theme as Theme)) return null;
  const picked = theme as Theme;
  if (kind === 'background') {
    const file = path.join(ROOT, picked, 'background', 'landing-background.png');
    return (await exists(file)) ? file : null;
  }
  const variant = rest?.[0];
  if (!variant || !ART_VARIANTS.includes(variant as ArtVariant)) return null;
  const face = variant as ArtVariant;
  if (kind === 'logo') {
    const named = await firstPng(path.join(ROOT, picked, 'logo', face));
    if (named) return named;
    if (face === 'cn') return null;
    return firstPng(path.join(ROOT, picked, 'logo', 'cn'));
  }
  if (kind === 'cards') {
    const id = rest?.[1];
    const fileName = id ? CARD_FILE[id] : undefined;
    if (!fileName) return null;
    return variantFile(picked, 'cards', face, fileName);
  }
  return null;
}

export async function GET(_request: Request, context: { params: Promise<{ theme: string; kind: string; rest?: string[] }> }) {
  const { theme, kind, rest } = await context.params;
  const file = await resolveArt(theme, kind, rest);
  if (!file || !file.startsWith(ROOT)) return new NextResponse('Not found', { status: 404 });
  const [bytes, info] = await Promise.all([readFile(file), stat(file)]);
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
      ETag: `"${info.mtimeMs}-${info.size}"`,
    },
  });
}
