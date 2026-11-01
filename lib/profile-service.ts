import { handleFromEmail, ownerView, parseProfilePatch, publicView, canViewProfile, withHandleSuffix, type ProfileRow, type Visibility } from './profile-policy.ts';

export type Queryable = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
};

export type AuthIdentity = {
  subject: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

const PROFILE_SQL = `
  SELECT u.id AS user_id, u.email, u.handle, u.status,
         p.display_name, p.bio, p.visibility, p.locale,
         COALESCE((SELECT array_agg(role ORDER BY role) FROM user_role ur WHERE ur.user_id = u.id), '{}') AS roles
  FROM app_user u
  JOIN profile p ON p.user_id = u.id
`;

function asRow(row: Record<string, unknown>, roles: string[]): ProfileRow {
  return {
    user_id: String(row.user_id),
    email: String(row.email),
    handle: String(row.handle),
    status: String(row.status),
    display_name: String(row.display_name),
    bio: String(row.bio ?? ''),
    visibility: String(row.visibility) as Visibility,
    locale: String(row.locale),
    roles,
  };
}

function rolesOf(raw: unknown) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.replace(/^\{|\}$/g, '').split(',').filter(Boolean);
  return [];
}

async function withRoles(_client: Queryable, row: Record<string, unknown> | undefined) {
  if (!row) return null;
  return asRow(row, rolesOf(row.roles));
}

async function loadBySubject(client: Queryable, subject: string) {
  const result = await client.query(`${PROFILE_SQL} WHERE u.auth_subject = $1`, [subject]);
  return withRoles(client, result.rows[0]);
}

async function loadByHandle(client: Queryable, handle: string) {
  const result = await client.query(`${PROFILE_SQL} WHERE lower(u.handle) = lower($1)`, [handle]);
  return withRoles(client, result.rows[0]);
}

export async function provisionUser(client: Queryable, actor: AuthIdentity) {
  const existing = await loadBySubject(client, actor.subject);
  if (existing) {
    if (existing.status === 'deleted') throw new Error('unavailable');
    if (existing.email.toLowerCase() !== actor.email.toLowerCase()) {
      const clash = await client.query(
        `SELECT 1 FROM app_user WHERE lower(email) = lower($1) AND auth_subject <> $2`,
        [actor.email, actor.subject],
      );
      if (clash.rows.length) throw new Error('unavailable');
      await client.query(
        `UPDATE app_user SET email = $2, email_verified_at = CASE WHEN $3 THEN COALESCE(email_verified_at, now()) ELSE email_verified_at END WHERE auth_subject = $1`,
        [actor.subject, actor.email, actor.emailVerified],
      );
      return (await loadBySubject(client, actor.subject)) ?? existing;
    }
    return existing;
  }

  const emailClash = await client.query(`SELECT 1 FROM app_user WHERE lower(email) = lower($1)`, [actor.email]);
  if (emailClash.rows.length) throw new Error('unavailable');

  const base = handleFromEmail(actor.email);
  let handle = base;
  let reserved = false;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    handle = attempt === 0 ? base : withHandleSuffix(base, attempt);
    const taken = await client.query(`SELECT 1 FROM app_user WHERE lower(handle) = lower($1)`, [handle]);
    if (!taken.rows.length) {
      reserved = true;
      break;
    }
  }
  if (!reserved) throw new Error('unavailable');

  const id = crypto.randomUUID();
  const displayName = (actor.name || handle).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 40) || handle;
  await client.query(
    `INSERT INTO app_user (id, auth_subject, email, handle, email_verified_at)
     VALUES ($1, $2, $3, $4, CASE WHEN $5 THEN now() ELSE NULL END)`,
    [id, actor.subject, actor.email, handle, actor.emailVerified],
  );
  await client.query(`INSERT INTO profile (user_id, display_name) VALUES ($1, $2)`, [id, displayName]);
  await client.query(`INSERT INTO user_role (user_id, role) VALUES ($1, 'player')`, [id]);
  await client.query(
    `INSERT INTO audit_log (id, actor_id, action, subject_type, subject_id, metadata) VALUES ($1, $2, 'user.provision', 'app_user', $3, $4::jsonb)`,
    [crypto.randomUUID(), id, id, '{}'],
  );
  const created = await loadBySubject(client, actor.subject);
  if (!created) throw new Error('unavailable');
  return created;
}

export async function getOwnProfile(client: Queryable, actor: AuthIdentity | null) {
  if (!actor?.subject || !actor.email) return { status: 401 as const, body: { error: 'Unauthorized' } };
  try {
    const row = await provisionUser(client, actor);
    return { status: 200 as const, body: ownerView(row) };
  } catch {
    return { status: 400 as const, body: { error: 'Unable to save profile' } };
  }
}

async function areFriends(client: Queryable, a: string, b: string) {
  const result = await client.query(
    `SELECT 1 FROM friend_request
     WHERE status = 'accepted' AND ((sender = $1 AND recipient = $2) OR (sender = $2 AND recipient = $1))`,
    [a, b],
  );
  return result.rows.length > 0;
}

export async function viewProfile(client: Queryable, viewer: AuthIdentity | null, handle: string) {
  const row = await loadByHandle(client, handle);
  if (!row) return { status: 404 as const, body: { error: 'Not found' } };
  const viewerRow = viewer ? await loadBySubject(client, viewer.subject) : null;
  if (viewerRow && viewerRow.user_id !== row.user_id) {
    const blockedBy = await client.query(`SELECT 1 FROM user_block WHERE blocker = $1 AND blocked = $2`, [row.user_id, viewerRow.user_id]);
    if (blockedBy.rows.length) return { status: 404 as const, body: { error: 'Not found' } };
  }
  const friends = viewerRow && viewerRow.user_id !== row.user_id ? await areFriends(client, viewerRow.user_id, row.user_id) : false;
  const allowed = canViewProfile({
    viewerId: viewerRow?.user_id ?? null,
    ownerId: row.user_id,
    visibility: row.visibility,
    friends,
    ownerStatus: row.status,
  });
  if (!allowed) return { status: 404 as const, body: { error: 'Not found' } };
  if (viewerRow?.user_id === row.user_id) return { status: 200 as const, body: ownerView(row) };
  return { status: 200 as const, body: publicView(row) };
}

export async function updateOwnProfile(client: Queryable, actor: AuthIdentity | null, input: unknown, originOk: boolean) {
  if (!actor?.subject || !actor.email) return { status: 401 as const, body: { error: 'Unauthorized' } };
  if (!originOk) return { status: 403 as const, body: { error: 'Forbidden' } };
  const parsed = parseProfilePatch(input);
  if (!parsed.ok) return { status: 400 as const, body: { error: 'Invalid input' } };
  let row: ProfileRow;
  try {
    row = await provisionUser(client, actor);
  } catch {
    return { status: 400 as const, body: { error: 'Unable to save profile' } };
  }
  if (row.status !== 'active') return { status: 403 as const, body: { error: 'Forbidden' } };
  const recent = await client.query(
    `SELECT id FROM audit_log WHERE actor_id = $1 AND action = 'profile.update' AND created_at > now() - interval '1 minute'`,
    [row.user_id],
  );
  if (recent.rows.length >= 10) return { status: 429 as const, body: { error: 'Too many requests' } };
  if (parsed.value.handle !== row.handle) {
    const taken = await client.query(
      `SELECT 1 FROM app_user WHERE lower(handle) = lower($1) AND id <> $2`,
      [parsed.value.handle, row.user_id],
    );
    if (taken.rows.length) return { status: 409 as const, body: { error: 'Unable to save profile' } };
    await client.query(`UPDATE app_user SET handle = $2 WHERE id = $1`, [row.user_id, parsed.value.handle]);
  }
  await client.query(
    `UPDATE profile SET display_name = $2, bio = $3, visibility = $4, locale = $5 WHERE user_id = $1`,
    [row.user_id, parsed.value.displayName, parsed.value.bio, parsed.value.visibility, parsed.value.locale],
  );
  await client.query(
    `INSERT INTO audit_log (id, actor_id, action, subject_type, subject_id, metadata) VALUES ($1, $2, 'profile.update', 'profile', $3, $4::jsonb)`,
    [crypto.randomUUID(), row.user_id, row.user_id, '{"fields":["handle","displayName","bio","visibility","locale"]}'],
  );
  const saved = await loadBySubject(client, actor.subject);
  if (!saved) return { status: 400 as const, body: { error: 'Unable to save profile' } };
  return { status: 200 as const, body: ownerView(saved) };
}
