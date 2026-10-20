import { createHash, randomInt, randomUUID } from 'node:crypto';
import type { EngineCommand, GameState, Projection, Seat } from '../src/engine.mjs';
import { project } from './engine.ts';
import {
  CASUAL_SEASON_ID,
  ELO_START,
  applyCommand,
  clockOwner,
  elo,
  expire,
  nextDeadline,
  openSnapshot,
  type AppliedCommand,
  type Snapshot,
} from './match-rules.ts';
import { COMPUTER_HANDLE, COMPUTER_USER_ID, chooseComputer } from './computer.ts';
import { mutationGate } from './profile-policy.ts';
import type { Queryable } from './profile-service.ts';

export type Mode = 'casual' | 'private';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROOM_CODE = /^[A-Z2-9]{6}$/;
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const QUEUE_LOCK = 72_000_201;
const fail = (status: number, error: string, extra: Record<string, unknown> = {}) => ({ status, body: { error, ...extra } });
const ms = (value: unknown) => (value === null || value === undefined ? null : new Date(value as string).getTime());

export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

export async function activeMatchFor(client: Queryable, userId: string) {
  const found = await client.query(
    `SELECT m.id FROM match m JOIN match_player p ON p.match_id = m.id
     WHERE p.user_id = $1 AND m.status = 'active' ORDER BY m.created_at DESC LIMIT 1`,
    [userId],
  );
  return found.rows[0] ? String(found.rows[0].id) : null;
}

async function createMatch(client: Queryable, mode: Mode, seat0: string, seat1: string, now: number) {
  const id = randomUUID();
  const snapshot = openSnapshot(randomInt(0, 2 ** 32));
  const deadline = nextDeadline(null, snapshot.game, null, now);
  await client.query(
    `INSERT INTO match (id, ruleset_id, status, mode, version, private_snapshot, deadline, created_at)
     VALUES ($1, 'digital-1.0', 'active', $2, $3, $4::jsonb, $5, $6)`,
    [id, mode, snapshot.game.version, JSON.stringify(snapshot), deadline === null ? null : new Date(deadline).toISOString(), new Date(now).toISOString()],
  );
  await client.query(`INSERT INTO match_player (match_id, seat, user_id) VALUES ($1, 0, $2), ($1, 1, $3)`, [id, seat0, seat1]);
  return id;
}

async function ensureComputer(client: Queryable) {
  await client.query(
    `INSERT INTO app_user (id, auth_subject, email, handle, email_verified_at, status)
     VALUES ($1, 'computer:grove', 'grove@ecodominion.invalid', $2, now(), 'active')
     ON CONFLICT (id) DO NOTHING`,
    [COMPUTER_USER_ID, COMPUTER_HANDLE],
  );
  await client.query(
    `INSERT INTO profile (user_id, display_name, bio, visibility)
     VALUES ($1, 'Grove', 'Practice opponent. This seat is unrated.', 'public')
     ON CONFLICT (user_id) DO NOTHING`,
    [COMPUTER_USER_ID],
  );
  await client.query(`INSERT INTO user_role (user_id, role) VALUES ($1, 'player') ON CONFLICT DO NOTHING`, [COMPUTER_USER_ID]);
}

/** Opens an unrated match against Grove and plays Grove's opening turn when Grove is first. */
export async function startPractice(client: Queryable, userId: string, now: number) {
  const gate = await mutationGate(client, userId);
  if (!gate.ok) return fail(403, gate.error);
  const active = await activeMatchFor(client, userId);
  if (active) return fail(409, 'Finish your current match first', { matchId: active });
  await ensureComputer(client);
  const id = await createMatch(client, 'private', userId, COMPUTER_USER_ID, now);
  let match = await loadMatch(client, id, true);
  if (!match) return fail(503, 'Unable to start practice');
  match = await advanceComputer(client, match, now);
  return { status: 201, body: { matchId: match.id } };
}

// ---------- Private rooms ----------

export async function createRoom(client: Queryable, userId: string) {
  const active = await activeMatchFor(client, userId);
  if (active) return fail(409, 'Finish your current match first', { matchId: active });
  const open = await client.query(`SELECT code FROM room WHERE host_id = $1 AND status = 'open'`, [userId]);
  if (open.rows[0]) return { status: 200, body: { code: String(open.rows[0].code), status: 'open', matchId: null } };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = Array.from({ length: 6 }, () => ROOM_ALPHABET[randomInt(ROOM_ALPHABET.length)]).join('');
    const inserted = await client.query(
      `INSERT INTO room (id, code, host_id) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING RETURNING code`,
      [randomUUID(), code, userId],
    );
    if (inserted.rows[0]) return { status: 201, body: { code, status: 'open', matchId: null } };
  }
  return fail(503, 'Unable to create a room right now');
}

export async function joinRoom(client: Queryable, userId: string, rawCode: unknown, now: number) {
  const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
  if (!ROOM_CODE.test(code)) return fail(400, 'Enter the six-character room code');
  const found = await client.query(`SELECT id, host_id, guest_id, status, match_id FROM room WHERE code = $1 FOR UPDATE`, [code]);
  const room = found.rows[0];
  if (!room || room.status === 'cancelled') return fail(404, 'Room not found');
  if (room.status === 'started') {
    if (room.host_id === userId || room.guest_id === userId) return { status: 200, body: { code, status: 'started', matchId: String(room.match_id) } };
    return fail(409, 'This room is already full');
  }
  if (room.host_id === userId) return fail(409, 'Share the code with another player; you are the host');
  const blocked = await client.query(
    `SELECT 1 FROM user_block WHERE (blocker = $1 AND blocked = $2) OR (blocker = $2 AND blocked = $1)`,
    [room.host_id, userId],
  );
  if (blocked.rows[0]) return fail(404, 'Room not found');
  for (const player of [String(room.host_id), userId]) {
    if (await activeMatchFor(client, player)) return fail(409, 'A player in this room is already in a match');
  }
  const matchId = await createMatch(client, 'private', String(room.host_id), userId, now);
  await client.query(`UPDATE room SET guest_id = $2, status = 'started', match_id = $3 WHERE id = $1`, [room.id, userId, matchId]);
  return { status: 200, body: { code, status: 'started', matchId } };
}

export async function getRoom(client: Queryable, userId: string, rawCode: unknown) {
  const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
  if (!ROOM_CODE.test(code)) return fail(404, 'Room not found');
  const found = await client.query(`SELECT host_id, guest_id, status, match_id FROM room WHERE code = $1`, [code]);
  const room = found.rows[0];
  if (!room || (room.host_id !== userId && room.guest_id !== userId)) return fail(404, 'Room not found');
  return { status: 200, body: { code, status: String(room.status), matchId: room.match_id ? String(room.match_id) : null } };
}

export async function cancelRoom(client: Queryable, userId: string, rawCode: unknown) {
  const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
  const updated = await client.query(
    `UPDATE room SET status = 'cancelled' WHERE code = $1 AND host_id = $2 AND status = 'open' RETURNING code`,
    [code, userId],
  );
  if (!updated.rows[0]) return fail(404, 'Room not found');
  return { status: 200, body: { code, status: 'cancelled', matchId: null } };
}

// ---------- Casual queue ----------

/** Serialised by a transaction-scoped advisory lock so two concurrent entries cannot both wait unmatched or double-match. */
async function admit(client: Queryable, now: number) {
  const pair = await client.query(
    `SELECT a.user_id AS first, b.user_id AS second
     FROM queue_entry a JOIN queue_entry b ON (b.enqueued_at, b.user_id) > (a.enqueued_at, a.user_id)
     WHERE a.status = 'waiting' AND b.status = 'waiting'
       AND NOT EXISTS (SELECT 1 FROM user_block k WHERE (k.blocker = a.user_id AND k.blocked = b.user_id) OR (k.blocker = b.user_id AND k.blocked = a.user_id))
     ORDER BY a.enqueued_at, a.user_id, b.enqueued_at, b.user_id LIMIT 1`,
  );
  if (!pair.rows[0]) return;
  const [first, second] = [String(pair.rows[0].first), String(pair.rows[0].second)];
  const matchId = await createMatch(client, 'casual', first, second, now);
  await client.query(`UPDATE queue_entry SET status = 'matched', match_id = $3 WHERE user_id IN ($1, $2)`, [first, second, matchId]);
}

async function queueView(client: Queryable, userId: string) {
  const entry = await client.query(`SELECT status, match_id FROM queue_entry WHERE user_id = $1`, [userId]);
  const row = entry.rows[0];
  if (!row) return { status: 'idle', matchId: null };
  return { status: String(row.status), matchId: row.match_id ? String(row.match_id) : null };
}

export async function enterQueue(client: Queryable, userId: string, now: number) {
  const gate = await mutationGate(client, userId);
  if (!gate.ok) return fail(403, gate.error);
  await client.query(`SELECT pg_advisory_xact_lock($1)`, [QUEUE_LOCK]);
  const active = await activeMatchFor(client, userId);
  if (active) return { status: 200, body: { status: 'matched', matchId: active } };
  await client.query(
    `INSERT INTO queue_entry (user_id, status, enqueued_at) VALUES ($1, 'waiting', $2)
     ON CONFLICT (user_id) DO UPDATE SET status = 'waiting', match_id = NULL, enqueued_at = EXCLUDED.enqueued_at
     WHERE queue_entry.status = 'matched'`,
    [userId, new Date(now).toISOString()],
  );
  await admit(client, now);
  return { status: 200, body: await queueView(client, userId) };
}

export async function queueStatus(client: Queryable, userId: string, now: number) {
  await client.query(`SELECT pg_advisory_xact_lock($1)`, [QUEUE_LOCK]);
  await admit(client, now);
  const view = await queueView(client, userId);
  if (view.status === 'matched' && view.matchId && !(await activeMatchFor(client, userId))) return { status: 200, body: { status: 'idle', matchId: null } };
  return { status: 200, body: view };
}

export async function leaveQueue(client: Queryable, userId: string) {
  await client.query(`SELECT pg_advisory_xact_lock($1)`, [QUEUE_LOCK]);
  await client.query(`DELETE FROM queue_entry WHERE user_id = $1 AND status = 'waiting'`, [userId]);
  return { status: 200, body: await queueView(client, userId) };
}

// ---------- Matches ----------

type MatchRow = { id: string; mode: Mode; status: string; version: number; snapshot: Snapshot; deadline: number | null };

async function loadMatch(client: Queryable, matchId: string, lock: boolean): Promise<MatchRow | null> {
  const found = await client.query(
    `SELECT id, mode, status, version, private_snapshot, deadline FROM match WHERE id = $1${lock ? ' FOR UPDATE' : ''}`,
    [matchId],
  );
  const row = found.rows[0];
  if (!row) return null;
  const snapshot = (typeof row.private_snapshot === 'string' ? JSON.parse(row.private_snapshot) : row.private_snapshot) as Snapshot;
  return { id: String(row.id), mode: row.mode as Mode, status: String(row.status), version: Number(row.version), snapshot, deadline: ms(row.deadline) };
}

async function seatOf(client: Queryable, matchId: string, userId: string): Promise<Seat | null> {
  const found = await client.query(`SELECT seat FROM match_player WHERE match_id = $1 AND user_id = $2`, [matchId, userId]);
  return found.rows[0] ? (Number(found.rows[0].seat) as Seat) : null;
}

/** Plays Grove's whole turn, including choices, then stops on the human's clock. */
async function advanceComputer(client: Queryable, match: MatchRow, now: number) {
  if (match.status !== 'active') return match;
  const bot = await seatOf(client, match.id, COMPUTER_USER_ID);
  if (bot === null) return match;
  let current = await loadMatch(client, match.id, true);
  if (!current) return match;
  current = await catchUp(client, current, now);
  const applied: AppliedCommand[] = [];
  let game = current.snapshot.game;
  let deadline = current.deadline;
  let previous: GameState = game;
  const timeouts: [number, number] = [...current.snapshot.timeouts];
  for (let step = 0; step < 40 && !game.result && clockOwner(game) === bot; step += 1) {
    const command = chooseComputer(game, bot);
    if (!command) break;
    let next: GameState;
    try {
      next = applyCommand(game, bot, command);
    } catch {
      break;
    }
    applied.push({ seat: bot, command, auto: true });
    timeouts[bot] = 0;
    deadline = nextDeadline(previous, next, deadline, now);
    previous = game;
    game = next;
  }
  if (!applied.length) return current;
  const snapshot: Snapshot = { ...current.snapshot, game, timeouts };
  await recordCommands(client, current.id, applied, current.version, (item) => `computer:${item.command.id}`);
  await persist(client, current, snapshot, deadline, now);
  return { ...current, version: game.version, snapshot, deadline, status: game.result ? 'finished' : match.status };
}

const requestHash = (body: Record<string, unknown>) => createHash('sha256').update(JSON.stringify(body)).digest('hex');

async function recordCommands(client: Queryable, matchId: string, applied: AppliedCommand[], startVersion: number, hashFor: (item: AppliedCommand) => string) {
  let version = startVersion;
  for (const item of applied) {
    const accepted = version + 1;
    await client.query(
      `INSERT INTO match_command (match_id, seat, command_id, request_hash, expected_version, accepted_version, payload_private, receipt_private)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
      [matchId, item.seat, item.command.id, hashFor(item), version, accepted, JSON.stringify({ ...item.command, auto: item.auto }), JSON.stringify({ acceptedVersion: accepted })],
    );
    await client.query(
      `INSERT INTO outbox (id, match_id, version, event_type, payload_private) VALUES ($1, $2, $3, 'match_changed', $4::jsonb)`,
      [randomUUID(), matchId, accepted, JSON.stringify({ version: accepted })],
    );
    version = accepted;
  }
}

/** Result and rating are written once: match_result's primary key gates the rating update in the same transaction. */
async function finish(client: Queryable, match: MatchRow, game: GameState, now: number) {
  const result = game.result!;
  const scores = result.scores ?? [null, null];
  const inserted = await client.query(
    `INSERT INTO match_result (match_id, winner_seat, reason, score0, score1, created_at) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (match_id) DO NOTHING RETURNING match_id`,
    [match.id, result.winner, result.reason, scores[0], scores[1], new Date(now).toISOString()],
  );
  await client.query(`UPDATE match SET status = 'finished', finished_at = $2 WHERE id = $1`, [match.id, new Date(now).toISOString()]);
  if (!inserted.rows[0] || match.mode !== 'casual') return;
  const players = await client.query(`SELECT seat, user_id FROM match_player WHERE match_id = $1 ORDER BY seat`, [match.id]);
  const ids = players.rows.map((row) => String(row.user_id));
  for (const id of ids) {
    await client.query(`INSERT INTO rating (season_id, user_id, rating, games) VALUES ($1, $2, $3, 0) ON CONFLICT DO NOTHING`, [CASUAL_SEASON_ID, id, ELO_START]);
  }
  const ratings = await client.query(
    `SELECT user_id, rating FROM rating WHERE season_id = $1 AND user_id IN ($2, $3) ORDER BY user_id FOR UPDATE`,
    [CASUAL_SEASON_ID, ids[0], ids[1]],
  );
  const before = ids.map((id) => Number(ratings.rows.find((row) => String(row.user_id) === id)!.rating));
  const score0 = result.winner === null ? 0.5 : result.winner === 0 ? 1 : 0;
  const after = elo(before[0], before[1], score0);
  for (let seat = 0; seat < 2; seat += 1) {
    await client.query(`UPDATE rating SET rating = $3, games = games + 1 WHERE season_id = $1 AND user_id = $2`, [CASUAL_SEASON_ID, ids[seat], after[seat]]);
    await client.query(`INSERT INTO rating_change (match_id, user_id, before_value, after_value) VALUES ($1, $2, $3, $4)`, [match.id, ids[seat], before[seat], after[seat]]);
  }
  await client.query(`UPDATE match_result SET rating_applied_at = $2 WHERE match_id = $1`, [match.id, new Date(now).toISOString()]);
}

async function persist(client: Queryable, match: MatchRow, snapshot: Snapshot, deadline: number | null, now: number) {
  const updated = await client.query(
    `UPDATE match SET version = $2, private_snapshot = $3::jsonb, deadline = $4 WHERE id = $1 AND version = $5 RETURNING id`,
    [match.id, snapshot.game.version, JSON.stringify(snapshot), deadline === null ? null : new Date(deadline).toISOString(), match.version],
  );
  if (!updated.rows[0]) throw new Error('Concurrent match update');
  if (snapshot.game.result) await finish(client, match, snapshot.game, now);
}

/** Applies expired deadlines under the row lock; returns the refreshed row. */
async function catchUp(client: Queryable, match: MatchRow, now: number) {
  if (match.status !== 'active' || match.deadline === null || match.deadline > now) return match;
  const expired = expire(match.snapshot, match.deadline, now, randomUUID);
  if (!expired.applied.length) return match;
  await recordCommands(client, match.id, expired.applied, match.version, (item) => `timeout:${item.command.type}`);
  await persist(client, match, expired.snapshot, expired.deadline, now);
  return { ...match, version: expired.snapshot.game.version, snapshot: expired.snapshot, deadline: expired.deadline, status: expired.snapshot.game.result ? 'finished' : 'active' };
}

async function participants(client: Queryable, matchId: string) {
  const found = await client.query(
    `SELECT mp.seat, u.handle, p.display_name FROM match_player mp JOIN app_user u ON u.id = mp.user_id JOIN profile p ON p.user_id = u.id
     WHERE mp.match_id = $1 ORDER BY mp.seat`,
    [matchId],
  );
  return found.rows.map((row) => ({ seat: Number(row.seat) as Seat, handle: String(row.handle), displayName: String(row.display_name) }));
}

export type MatchView = {
  id: string;
  mode: Mode;
  status: string;
  seat: Seat;
  version: number;
  deadline: string | null;
  clockSeat: Seat | null;
  timeouts: [number, number];
  players: { seat: Seat; handle: string; displayName: string }[];
  rating: { before: number; after: number } | null;
  game: Projection;
};

async function buildView(client: Queryable, match: MatchRow, seat: Seat, userId: string): Promise<MatchView> {
  const change = match.mode === 'casual' && match.status === 'finished'
    ? (await client.query(`SELECT before_value, after_value FROM rating_change WHERE match_id = $1 AND user_id = $2`, [match.id, userId])).rows[0]
    : undefined;
  return {
    id: match.id,
    mode: match.mode,
    status: match.status,
    seat,
    version: match.version,
    deadline: match.deadline === null ? null : new Date(match.deadline).toISOString(),
    clockSeat: clockOwner(match.snapshot.game),
    timeouts: match.snapshot.timeouts,
    players: await participants(client, match.id),
    rating: change ? { before: Number(change.before_value), after: Number(change.after_value) } : null,
    game: project(match.snapshot.game, seat),
  };
}

export async function viewMatch(client: Queryable, userId: string, matchId: unknown, now: number, knownVersion?: number) {
  if (!isUuid(matchId)) return fail(404, 'Match not found');
  const seat = await seatOf(client, matchId, userId);
  if (seat === null) return fail(404, 'Match not found');
  let match = await loadMatch(client, matchId, false);
  if (!match) return fail(404, 'Match not found');
  if (match.status === 'active' && match.deadline !== null && match.deadline <= now) {
    match = await catchUp(client, (await loadMatch(client, matchId, true))!, now);
  }
  match = await advanceComputer(client, match, now);
  if (knownVersion !== undefined && knownVersion === match.version) {
    return { status: 200, body: { unchanged: true, version: match.version, deadline: match.deadline === null ? null : new Date(match.deadline).toISOString() } };
  }
  return { status: 200, body: await buildView(client, match, seat, userId) };
}

const COMMAND_TYPES = new Set(['play', 'pass', 'choose', 'concede']);
const shortText = (value: unknown) => (typeof value === 'string' && value.length > 0 && value.length <= 40 ? value : undefined);

export function parseCommand(input: unknown) {
  if (!input || typeof input !== 'object') return null;
  const body = input as Record<string, unknown>;
  if (!isUuid(body.commandId) || !Number.isInteger(body.expectedVersion) || (body.expectedVersion as number) < 0) return null;
  if (typeof body.type !== 'string' || !COMMAND_TYPES.has(body.type)) return null;
  const uids = Array.isArray(body.uids) ? body.uids : undefined;
  if (uids && (uids.length > 10 || !uids.every((uid) => shortText(uid)))) return null;
  const fields = {
    type: body.type,
    expectedVersion: body.expectedVersion as number,
    uid: shortText(body.uid),
    region: shortText(body.region),
    target: shortText(body.target),
    species: shortText(body.species),
    uids: uids as string[] | undefined,
    skip: body.skip === true ? true : undefined,
  };
  return { commandId: body.commandId, fields };
}

export async function submitCommand(client: Queryable, userId: string, matchId: unknown, input: unknown, now: number) {
  const gate = await mutationGate(client, userId);
  if (!gate.ok) return fail(403, gate.error);
  if (!isUuid(matchId)) return fail(404, 'Match not found');
  const parsed = parseCommand(input);
  if (!parsed) return fail(400, 'Invalid command');
  const seat = await seatOf(client, matchId, userId);
  if (seat === null) return fail(404, 'Match not found');
  let match = await loadMatch(client, matchId, true);
  if (!match) return fail(404, 'Match not found');
  match = await catchUp(client, match, now);

  const hash = requestHash(parsed.fields);
  const prior = await client.query(
    `SELECT request_hash, receipt_private FROM match_command WHERE match_id = $1 AND seat = $2 AND command_id = $3`,
    [match.id, seat, parsed.commandId],
  );
  if (prior.rows[0]) {
    if (prior.rows[0].request_hash !== hash) return fail(409, 'Command ID was already used for a different command');
    const receipt = typeof prior.rows[0].receipt_private === 'string' ? JSON.parse(prior.rows[0].receipt_private) : prior.rows[0].receipt_private;
    return { status: 200, body: { duplicate: true, receipt, view: await buildView(client, match, seat, userId) } };
  }
  if (match.status !== 'active') return fail(409, 'This match has finished', { version: match.version });
  if (parsed.fields.expectedVersion !== match.version) return fail(409, 'The match has moved on; refresh and try again', { version: match.version });

  const { expectedVersion, ...rest } = parsed.fields;
  const command: EngineCommand = { id: parsed.commandId, version: expectedVersion, ...Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined)) } as EngineCommand;
  let game: GameState;
  try {
    game = applyCommand(match.snapshot.game, seat, command);
  } catch (error) {
    return fail(422, error instanceof Error ? error.message : 'Illegal command', { version: match.version });
  }
  const timeouts: [number, number] = [...match.snapshot.timeouts];
  timeouts[seat] = 0;
  const snapshot: Snapshot = { ...match.snapshot, game, timeouts };
  const deadline = nextDeadline(match.snapshot.game, game, match.deadline, now);
  await recordCommands(client, match.id, [{ seat, command, auto: false }], match.version, () => hash);
  await persist(client, match, snapshot, deadline, now);
  const saved = { ...match, version: game.version, snapshot, deadline, status: game.result ? 'finished' : 'active' };
  const advanced = await advanceComputer(client, saved, now);
  return { status: 200, body: { duplicate: false, receipt: { acceptedVersion: advanced.version }, view: await buildView(client, advanced, seat, userId) } };
}

// ---------- History, leaderboard, replay ----------

export async function history(client: Queryable, userId: string) {
  const found = await client.query(
    `SELECT m.id, m.mode, m.finished_at, r.winner_seat, r.reason, r.score0, r.score1, me.seat,
            u.handle AS opponent_handle, rc.before_value, rc.after_value
     FROM match_player me
     JOIN match m ON m.id = me.match_id AND m.status = 'finished'
     JOIN match_result r ON r.match_id = m.id
     JOIN match_player them ON them.match_id = m.id AND them.seat <> me.seat
     JOIN app_user u ON u.id = them.user_id
     LEFT JOIN rating_change rc ON rc.match_id = m.id AND rc.user_id = me.user_id
     WHERE me.user_id = $1 ORDER BY m.finished_at DESC LIMIT 50`,
    [userId],
  );
  return {
    status: 200,
    body: {
      matches: found.rows.map((row) => {
        const seat = Number(row.seat);
        const winner = row.winner_seat === null ? null : Number(row.winner_seat);
        return {
          id: String(row.id),
          mode: String(row.mode),
          finishedAt: new Date(row.finished_at as string).toISOString(),
          outcome: winner === null ? 'draw' : winner === seat ? 'win' : 'loss',
          reason: String(row.reason),
          scores: row.score0 === null ? null : [Number(row.score0), Number(row.score1)],
          seat,
          opponent: String(row.opponent_handle),
          rating: row.before_value === null ? null : { before: Number(row.before_value), after: Number(row.after_value) },
        };
      }),
    },
  };
}

export async function leaderboard(client: Queryable) {
  const found = await client.query(
    `SELECT r.rating, r.games, CASE WHEN p.visibility = 'public' AND u.status = 'active' THEN u.handle END AS handle,
            CASE WHEN p.visibility = 'public' AND u.status = 'active' THEN p.display_name END AS display_name
     FROM rating r JOIN app_user u ON u.id = r.user_id JOIN profile p ON p.user_id = u.id
     WHERE r.season_id = $1 AND r.games > 0 AND u.status <> 'deleted'
     ORDER BY r.rating DESC, r.games DESC, u.id LIMIT 50`,
    [CASUAL_SEASON_ID],
  );
  return {
    status: 200,
    body: {
      entries: found.rows.map((row, index) => ({
        rank: index + 1,
        rating: Number(row.rating),
        games: Number(row.games),
        handle: row.handle === null ? null : String(row.handle),
        displayName: row.display_name === null ? null : String(row.display_name),
      })),
    },
  };
}

/** Participants step through a finished match from their own seat; the replay is recomputed from the private seed. */
export async function replay(client: Queryable, userId: string, matchId: unknown, rawStep: unknown) {
  if (!isUuid(matchId)) return fail(404, 'Match not found');
  const seat = await seatOf(client, matchId, userId);
  if (seat === null) return fail(404, 'Match not found');
  const match = await loadMatch(client, matchId, false);
  if (!match) return fail(404, 'Match not found');
  if (match.status !== 'finished') return fail(409, 'Replay opens when the match finishes');
  const commands = await client.query(
    `SELECT seat, accepted_version, payload_private FROM match_command WHERE match_id = $1 ORDER BY accepted_version`,
    [matchId],
  );
  const total = commands.rows.length;
  const step = Math.min(total, Math.max(0, Number.isInteger(Number(rawStep)) ? Number(rawStep) : total));
  let game = openSnapshot(match.snapshot.seed).game;
  const moves: { step: number; seat: Seat; type: string; auto: boolean }[] = [];
  for (const [index, row] of commands.rows.entries()) {
    const payload = (typeof row.payload_private === 'string' ? JSON.parse(row.payload_private) : row.payload_private) as EngineCommand & { auto?: boolean };
    const mover = Number(row.seat) as Seat;
    if (index < step) {
      game = applyCommand(game, mover, payload);
      if (game.version !== Number(row.accepted_version)) return fail(500, 'Replay could not be reconstructed');
    }
    moves.push({ step: index + 1, seat: mover, type: payload.type, auto: Boolean(payload.auto) });
  }
  if (step === total && game.version !== match.version) return fail(500, 'Replay could not be reconstructed');
  return { status: 200, body: { id: match.id, seat, step, total, moves, players: await participants(client, match.id), game: project(game, seat) } };
}
