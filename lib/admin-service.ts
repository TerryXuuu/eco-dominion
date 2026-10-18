import { randomUUID } from 'node:crypto';
import { REASON_MAX, cleanText } from './community-policy.ts';
import { moderate } from './community-service.ts';
import { CASUAL_SEASON_ID, ELO_START } from './match-rules.ts';
import { mutationGate } from './profile-policy.ts';
import type { Queryable } from './profile-service.ts';

const fail = <S extends 400 | 403 | 404 | 409>(status: S, error: string) => ({ status, body: { error } as const });

export type AdminPerson = {
  id: string;
  handle: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
  rating: number;
  games: number;
  createdAt: string;
  verified: boolean;
};

export type AdminMatch = {
  id: string;
  mode: string;
  status: string;
  createdAt: string;
  finishedAt: string | null;
  players: [string | null, string | null];
  scores: [number, number] | null;
  winner: string | null;
  reason: string | null;
  ratings: [{ before: number; after: number } | null, { before: number; after: number } | null];
};

export type AdminAudit = {
  id: string;
  action: string;
  actor: string;
  subject: string;
  detail: string;
  createdAt: string;
};

export type AdminOverview = {
  viewerId: string;
  people: AdminPerson[];
  matches: AdminMatch[];
  actions: AdminAudit[];
};

async function isAdmin(client: Queryable, userId: string) {
  return (await client.query(`SELECT 1 FROM user_role WHERE user_id = $1 AND role = 'admin'`, [userId])).rows.length > 0;
}

function rolesOf(value: unknown) {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.replace(/^\{|\}$/g, '').split(',') : [];
  return list.map(String).filter(Boolean).sort();
}

function iso(value: unknown) {
  return new Date(value as string).toISOString();
}

function likePattern(query: string) {
  return `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function auditDetail(action: string, metadata: Record<string, unknown>) {
  const reason = typeof metadata.reason === 'string' ? metadata.reason : '';
  if (action.startsWith('role.') && typeof metadata.role === 'string') return [metadata.role, reason].filter(Boolean).join(' · ');
  if (action === 'rating.adjust' && metadata.before !== undefined && metadata.after !== undefined) {
    return [`${metadata.before} → ${metadata.after}`, reason].filter(Boolean).join(' · ');
  }
  return reason || action;
}

/** People, registrations, recent matches and audited admin actions. Admin only. Match boards stay private. */
export async function adminOverview(client: Queryable, adminId: string, rawQuery: unknown = '') {
  if (!(await isAdmin(client, adminId))) return fail(403, 'Admins only');
  const query = typeof rawQuery === 'string' ? rawQuery.trim().slice(0, 80) : '';
  const people = await client.query(
    `SELECT u.id, u.handle, u.email, u.status, u.created_at, u.email_verified_at, p.display_name,
            COALESCE(rt.rating, $2) AS rating, COALESCE(rt.games, 0) AS games,
            COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles
     FROM app_user u
     JOIN profile p ON p.user_id = u.id
     LEFT JOIN rating rt ON rt.user_id = u.id AND rt.season_id = $1
     LEFT JOIN user_role ur ON ur.user_id = u.id
     WHERE ($3 = '' OR u.handle ILIKE $4 ESCAPE '\\' OR u.email ILIKE $4 ESCAPE '\\' OR p.display_name ILIKE $4 ESCAPE '\\')
     GROUP BY u.id, u.handle, u.email, u.status, u.created_at, u.email_verified_at, p.display_name, rt.rating, rt.games
     ORDER BY u.created_at DESC, u.id
     LIMIT 50`,
    [CASUAL_SEASON_ID, ELO_START, query, query ? likePattern(query) : '%'],
  );
  const matches = await client.query(
    `SELECT m.id, m.mode, m.status, m.created_at, m.finished_at, r.winner_seat, r.reason, r.score0, r.score1,
            a0.handle AS handle0, a1.handle AS handle1,
            c0.before_value AS before0, c0.after_value AS after0, c1.before_value AS before1, c1.after_value AS after1
     FROM match m
     LEFT JOIN match_result r ON r.match_id = m.id
     LEFT JOIN match_player s0 ON s0.match_id = m.id AND s0.seat = 0
     LEFT JOIN app_user a0 ON a0.id = s0.user_id
     LEFT JOIN match_player s1 ON s1.match_id = m.id AND s1.seat = 1
     LEFT JOIN app_user a1 ON a1.id = s1.user_id
     LEFT JOIN rating_change c0 ON c0.match_id = m.id AND c0.user_id = s0.user_id
     LEFT JOIN rating_change c1 ON c1.match_id = m.id AND c1.user_id = s1.user_id
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT 30`,
  );
  const actions = await client.query(
    `SELECT a.id, a.action, a.metadata, a.created_at, actor.handle AS actor, subject.handle AS subject
     FROM audit_log a
     LEFT JOIN app_user actor ON actor.id = a.actor_id
     LEFT JOIN app_user subject ON subject.id::text = a.subject_id
     WHERE a.action IN ('role.grant', 'role.revoke', 'rating.adjust') OR a.action LIKE 'moderation.%'
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT 30`,
  );
  const body: AdminOverview = {
    viewerId: adminId,
    people: people.rows.map((row) => ({
      id: String(row.id),
      handle: String(row.handle),
      email: String(row.email),
      displayName: String(row.display_name),
      status: String(row.status),
      roles: rolesOf(row.roles),
      rating: Number(row.rating),
      games: Number(row.games),
      createdAt: iso(row.created_at),
      verified: row.email_verified_at != null,
    })),
    matches: matches.rows.map((row) => {
      const players: [string | null, string | null] = [row.handle0 ? String(row.handle0) : null, row.handle1 ? String(row.handle1) : null];
      const winnerSeat = row.winner_seat === null || row.winner_seat === undefined ? null : Number(row.winner_seat);
      const change = (before: unknown, after: unknown) => (before === null || before === undefined ? null : { before: Number(before), after: Number(after) });
      return {
        id: String(row.id),
        mode: String(row.mode),
        status: String(row.status),
        createdAt: iso(row.created_at),
        finishedAt: row.finished_at ? iso(row.finished_at) : null,
        players,
        scores: row.score0 === null || row.score0 === undefined ? null : [Number(row.score0), Number(row.score1)],
        winner: winnerSeat === null ? null : players[winnerSeat],
        reason: row.reason ? String(row.reason) : null,
        ratings: [change(row.before0, row.after0), change(row.before1, row.after1)],
      };
    }),
    actions: actions.rows.map((row) => {
      const metadata = (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata ?? {}) as Record<string, unknown>;
      return {
        id: String(row.id),
        action: String(row.action),
        actor: row.actor ? String(row.actor) : 'operator',
        subject: row.subject ? String(row.subject) : String(row.id),
        detail: auditDetail(String(row.action), metadata),
        createdAt: iso(row.created_at),
      };
    }),
  };
  return { status: 200 as const, body };
}

async function findAccount(client: Queryable, handle: unknown) {
  if (typeof handle !== 'string' || !/^[a-z0-9_]{3,24}$/i.test(handle)) return null;
  const row = (await client.query(`SELECT id, handle, status FROM app_user WHERE lower(handle) = lower($1)`, [handle])).rows[0];
  return row ? { id: String(row.id), handle: String(row.handle), status: String(row.status) } : null;
}

async function writeAudit(client: Queryable, actorId: string, action: string, subjectId: string, metadata: Record<string, unknown>) {
  await client.query(
    `INSERT INTO audit_log (id, actor_id, action, subject_type, subject_id, metadata) VALUES ($1, $2, $3, 'app_user', $4, $5::jsonb)`,
    [randomUUID(), actorId, action, subjectId, JSON.stringify(metadata)],
  );
}

/** Suspend or restore an account, grant or revoke moderator/admin, or set a casual rating. Each change is audited. */
export async function adminAct(client: Queryable, adminId: string, input: unknown) {
  if (!(await isAdmin(client, adminId))) return fail(403, 'Admins only');
  const gate = await mutationGate(client, adminId);
  if (!gate.ok) return fail(403, gate.error);
  const raw = (input ?? {}) as Record<string, unknown>;
  const reason = cleanText(raw.reason, REASON_MAX);
  if (!reason || reason.length < 3) return fail(400, 'Give a reason of 3–500 characters');
  const account = await findAccount(client, raw.handle);
  if (!account) return fail(404, 'Player not found');
  if (account.status === 'deleted') return fail(409, 'That account is deleted');

  let message = 'Saved';
  if (raw.kind === 'account') {
    if (account.id === adminId) return fail(403, 'You cannot change your own account status');
    const action = raw.action === 'suspend' || raw.action === 'unsuspend' ? raw.action : null;
    if (!action) return fail(400, 'Choose suspend or restore');
    const result = await moderate(client, adminId, { action, reason, subjectType: 'user', subjectId: account.id });
    if (result.status !== 200) return result;
    message = action === 'suspend' ? `@${account.handle} is suspended` : `@${account.handle} is active again`;
  } else if (raw.kind === 'role') {
    const role = raw.role === 'moderator' || raw.role === 'admin' ? raw.role : null;
    if (!role) return fail(400, 'Choose moderator or admin');
    const revoke = raw.revoke === true;
    if (revoke && role === 'admin' && account.id === adminId) return fail(403, 'You cannot remove your own admin role');
    const changed = revoke
      ? await client.query(`DELETE FROM user_role WHERE user_id = $1 AND role = $2 RETURNING role`, [account.id, role])
      : await client.query(`INSERT INTO user_role (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING role`, [account.id, role]);
    if (!changed.rows[0]) return fail(409, revoke ? `@${account.handle} does not have that role` : `@${account.handle} already has that role`);
    await writeAudit(client, adminId, revoke ? 'role.revoke' : 'role.grant', account.id, { role, reason });
    message = revoke ? `Removed ${role} from @${account.handle}` : `Granted ${role} to @${account.handle}`;
  } else if (raw.kind === 'rating') {
    const next = typeof raw.rating === 'number' ? raw.rating : Number(raw.rating);
    if (!Number.isInteger(next) || next < 0 || next > 4000) return fail(400, 'Rating must be a whole number from 0 to 4000');
    await client.query(
      `INSERT INTO rating (season_id, user_id, rating, games) VALUES ($1, $2, $3, 0) ON CONFLICT DO NOTHING`,
      [CASUAL_SEASON_ID, account.id, ELO_START],
    );
    const current = await client.query(
      `SELECT rating, games FROM rating WHERE season_id = $1 AND user_id = $2 FOR UPDATE`,
      [CASUAL_SEASON_ID, account.id],
    );
    const before = Number(current.rows[0].rating);
    if (before === next) return fail(409, 'That is already the casual rating');
    await client.query(`UPDATE rating SET rating = $3 WHERE season_id = $1 AND user_id = $2`, [CASUAL_SEASON_ID, account.id, next]);
    await writeAudit(client, adminId, 'rating.adjust', account.id, { before, after: next, reason, season: 'casual' });
    message = `@${account.handle} casual rating ${before} → ${next}`;
  } else {
    return fail(400, 'Choose an admin action');
  }

  const overview = await adminOverview(client, adminId);
  if (overview.status !== 200) return overview;
  return { status: 200 as const, body: { message, ...overview.body } };
}
