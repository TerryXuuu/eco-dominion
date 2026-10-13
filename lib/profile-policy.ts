export const VISIBILITIES = ['public', 'friends', 'private'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export type ProfilePatch = {
  displayName: string;
  bio: string;
  visibility: Visibility;
  locale: string;
  handle: string;
};

const HANDLE = /^[a-z0-9_]{3,24}$/;
const LOCALE = /^[a-z]{2}-[A-Z]{2}$/;

function clean(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

export function handleFromEmail(email: string) {
  const local = email.split('@')[0] ?? '';
  const cleaned = local.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  const base = cleaned.length >= 3 ? cleaned : `player${cleaned}`;
  return base.slice(0, 24);
}

export function withHandleSuffix(base: string, attempt: number) {
  const suffix = `_${attempt.toString(36)}`;
  return `${base.slice(0, 24 - suffix.length)}${suffix}`;
}

export function parseProfilePatch(input: unknown): { ok: true; value: ProfilePatch } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Invalid input' };
  const raw = input as Record<string, unknown>;
  const displayName = typeof raw.displayName === 'string' ? clean(raw.displayName) : '';
  const bio = typeof raw.bio === 'string' ? clean(raw.bio) : '';
  const handle = typeof raw.handle === 'string' ? clean(raw.handle).toLowerCase() : '';
  const locale = typeof raw.locale === 'string' ? clean(raw.locale) : '';
  const visibility = raw.visibility;
  if (displayName.length < 1 || displayName.length > 40) return { ok: false, error: 'Invalid input' };
  if (bio.length > 280) return { ok: false, error: 'Invalid input' };
  if (!HANDLE.test(handle)) return { ok: false, error: 'Invalid input' };
  if (!LOCALE.test(locale)) return { ok: false, error: 'Invalid input' };
  if (visibility !== 'public' && visibility !== 'friends' && visibility !== 'private') return { ok: false, error: 'Invalid input' };
  return { ok: true, value: { displayName, bio, visibility, locale, handle } };
}

export function canViewProfile(args: {
  viewerId: string | null;
  ownerId: string;
  visibility: Visibility;
  friends: boolean;
  ownerStatus: string;
}) {
  if (args.ownerStatus === 'deleted') return false;
  if (args.viewerId && args.viewerId === args.ownerId) return true;
  if (args.ownerStatus !== 'active') return false;
  if (args.visibility === 'public') return true;
  if (args.visibility === 'friends' && args.friends) return true;
  return false;
}

/** Suspended accounts keep read access; only active accounts may change anything. */
export function accountGate(status: string, mutation: boolean): { ok: true } | { ok: false; error: string } {
  if (status === 'active') return { ok: true };
  if (status === 'suspended') return mutation ? { ok: false, error: 'Your account is suspended; you can read but not make changes' } : { ok: true };
  return { ok: false, error: 'Forbidden' };
}

export function sameOrigin(request: { headers: { get(name: string): string | null } }) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export type ProfileRow = {
  user_id: string;
  email: string;
  handle: string;
  status: string;
  display_name: string;
  bio: string;
  visibility: Visibility;
  locale: string;
  roles: string[];
};

export function ownerView(row: ProfileRow) {
  return {
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    visibility: row.visibility,
    locale: row.locale,
    email: row.email,
    status: row.status,
    roles: row.roles,
  };
}

export type OwnerProfile = ReturnType<typeof ownerView>;

export function publicView(row: ProfileRow) {
  return {
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    visibility: row.visibility,
  };
}
