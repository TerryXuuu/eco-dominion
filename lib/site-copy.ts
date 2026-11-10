export const DEFAULT_SITE_COPY = {
  copyright: '© Eco Dominion. All rights reserved.',
  contacts: 'Terry & Lynx',
};

export type SiteCopy = typeof DEFAULT_SITE_COPY;

const COPY_TTL_MS = 10 * 60_000;
let cache: { at: number; value: SiteCopy } | null = null;
let generation = 0;

export function forgetSiteCopy() {
  generation += 1;
  cache = null;
}

export function readSiteCopy() {
  if (cache && Date.now() - cache.at < COPY_TTL_MS) return cache.value;
  return null;
}

/** Ignore a result that started before an admin save cleared the cache. */
export function rememberSiteCopy(seen: number, value: SiteCopy) {
  if (generation === seen) cache = { at: Date.now(), value };
  return generation;
}

export function siteCopyGeneration() {
  return generation;
}
