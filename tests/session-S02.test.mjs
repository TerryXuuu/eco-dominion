import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { provisionUser } from '../lib/profile-service.ts';
import { CHOICE_MS, MAX_TIMEOUTS, TURN_MS, elo, expire, openSnapshot, timeoutChoice } from '../lib/match-rules.ts';
import {
  createRoom,
  enterQueue,
  getRoom,
  history,
  joinRoom,
  leaderboard,
  queueStatus,
  replay,
  submitCommand,
  viewMatch,
} from '../lib/match-service.ts';

const T0 = Date.parse('2026-10-13T09:00:00Z');
const people = ['ada', 'bea', 'cy', 'dee'].map((name) => ({ subject: `auth-${name}`, email: `${name}@example.com`, name, emailVerified: true }));

async function setup() {
  const db = new PGlite();
  await db.exec(readFileSync(new URL('../db/001_initial.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../db/002_play.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../db/004_room_finished.sql', import.meta.url), 'utf8'));
  await db.query(`INSERT INTO ruleset (id, content_hash, catalog, digital_rules, approved_at) VALUES ('digital-1.0', 'test', '{}', '{"ranked":false}', now())`);
  const ids = [];
  for (const person of people) ids.push((await provisionUser(db, person)).user_id);
  return { db, ids };
}

/** Runs one service call in its own transaction, as the API routes do. */
async function tx(db, fn) {
  await db.exec('BEGIN');
  try {
    const result = await fn();
    await db.exec('COMMIT');
    return result;
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

const command = (view, type, extra = {}) => ({ commandId: randomUUID(), expectedVersion: view.version, type, ...extra });

/** The move a cooperative test player makes: answer any forced choice, otherwise pass. */
function nextMove(view) {
  const pending = view.game.pending;
  if (pending && pending.owner === view.seat) {
    const hand = view.game.players[view.seat].hand;
    if (pending.kind === 'discard') return command(view, 'choose', { uids: hand.slice(-pending.count).map((card) => card.uid) });
    if (pending.kind === 'rest') return command(view, 'choose', { region: pending.options[0] });
    if (pending.kind === 'migration') return command(view, 'choose', { skip: true });
    return command(view, 'choose', { region: 'forest' });
  }
  return command(view, 'pass');
}

test('casual queue admits two players atomically into one match with both seats', async () => {
  const { db, ids } = await setup();
  const [ada, bea] = ids;
  const first = await tx(db, () => enterQueue(db, ada, T0));
  assert.deepEqual(first.body, { status: 'waiting', matchId: null });
  const again = await tx(db, () => enterQueue(db, ada, T0 + 1));
  assert.equal(again.body.status, 'waiting');
  const second = await tx(db, () => enterQueue(db, bea, T0 + 2));
  assert.equal(second.body.status, 'matched');
  const adaStatus = await tx(db, () => queueStatus(db, ada, T0 + 3));
  assert.equal(adaStatus.body.matchId, second.body.matchId);
  const seats = await db.query(`SELECT seat, user_id FROM match_player WHERE match_id = $1 ORDER BY seat`, [second.body.matchId]);
  assert.deepEqual(seats.rows.map((row) => row.user_id), [ada, bea]);
  assert.equal((await db.query(`SELECT count(*)::int AS n FROM match`)).rows[0].n, 1);
  assert.equal((await db.query(`SELECT mode FROM match`)).rows[0].mode, 'casual');
  const busy = await tx(db, () => createRoom(db, ada));
  assert.equal(busy.status, 409);
  assert.equal(busy.body.matchId, second.body.matchId);
});

test('views hide the opponent hand, seed and deck order; non-members get 404', async () => {
  const { db, ids } = await setup();
  const [ada, bea, cy] = ids;
  await tx(db, () => enterQueue(db, ada, T0));
  const { body } = await tx(db, () => enterQueue(db, bea, T0 + 1));
  const views = [await tx(db, () => viewMatch(db, ada, body.matchId, T0)), await tx(db, () => viewMatch(db, bea, body.matchId, T0))];
  const stored = (await db.query(`SELECT private_snapshot FROM match WHERE id = $1`, [body.matchId])).rows[0].private_snapshot;
  for (const [seat, view] of views.entries()) {
    assert.equal(view.status, 200);
    assert.equal(view.body.seat, seat);
    const other = 1 - seat;
    assert.ok(view.body.game.players[seat].hand.length >= 5);
    assert.equal(view.body.game.players[other].hand, undefined);
    assert.equal(view.body.game.players[other].handCount, stored.game.players[other].hand.length);
    const text = JSON.stringify(view.body);
    for (const card of stored.game.players[other].hand) assert.equal(text.includes(`"${card.uid}"`), false, 'opponent card uid leaked');
    for (const card of stored.game.deck.slice(-5)) assert.equal(text.includes(`"${card.uid}"`), false, 'deck card leaked');
    assert.doesNotMatch(text, /"seed"|"rng"|"deck"|"eventDeck"|"accepted"/);
  }
  assert.equal((await tx(db, () => viewMatch(db, cy, body.matchId, T0))).status, 404);
  assert.equal((await tx(db, () => viewMatch(db, ada, 'not-a-uuid', T0))).status, 404);
});

test('duplicate commands apply once, reused IDs and stale versions are rejected, turn order is enforced', async () => {
  const { db, ids } = await setup();
  const [ada, bea, cy] = ids;
  await tx(db, () => enterQueue(db, ada, T0));
  const { body } = await tx(db, () => enterQueue(db, bea, T0 + 1));
  const opening = (await tx(db, () => viewMatch(db, ada, body.matchId, T0))).body;
  const activeUser = ids[opening.clockSeat];
  const waitingUser = ids[1 - opening.clockSeat];
  const view = (await tx(db, () => viewMatch(db, activeUser, body.matchId, T0))).body;
  const move = nextMove(view);

  const accepted = await tx(db, () => submitCommand(db, activeUser, body.matchId, move, T0 + 10));
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.duplicate, false);
  assert.equal(accepted.body.receipt.acceptedVersion, view.version + 1);
  const repeat = await tx(db, () => submitCommand(db, activeUser, body.matchId, move, T0 + 20));
  assert.equal(repeat.status, 200);
  assert.equal(repeat.body.duplicate, true);
  assert.deepEqual(repeat.body.receipt, accepted.body.receipt);
  assert.equal(repeat.body.view.version, view.version + 1);
  const rows = await db.query(`SELECT count(*)::int AS n FROM match_command WHERE match_id = $1 AND command_id = $2`, [body.matchId, move.commandId]);
  assert.equal(rows.rows[0].n, 1);

  const reused = await tx(db, () => submitCommand(db, activeUser, body.matchId, { ...move, type: 'concede' }, T0 + 30));
  assert.equal(reused.status, 409);
  const stale = await tx(db, () => submitCommand(db, activeUser, body.matchId, { ...move, commandId: randomUUID() }, T0 + 40));
  assert.equal(stale.status, 409);
  assert.equal(stale.body.version, view.version + 1);
  const current = (await tx(db, () => viewMatch(db, waitingUser, body.matchId, T0 + 50))).body;
  if (current.clockSeat !== current.seat) {
    const outOfTurn = await tx(db, () => submitCommand(db, waitingUser, body.matchId, command(current, 'pass'), T0 + 60));
    assert.equal(outOfTurn.status, 422);
  }
  const stranger = await tx(db, () => submitCommand(db, cy, body.matchId, command(current, 'pass'), T0 + 70));
  assert.equal(stranger.status, 404);
  const malformed = await tx(db, () => submitCommand(db, activeUser, body.matchId, { type: 'pass' }, T0 + 80));
  assert.equal(malformed.status, 400);
  assert.equal((await tx(db, () => viewMatch(db, activeUser, body.matchId, T0 + 90))).body.version, view.version + 1);
});

test('a complete persisted casual match records one result, rates once, and replays from the private seed', async () => {
  const { db, ids } = await setup();
  const [ada, bea] = ids;
  await tx(db, () => enterQueue(db, ada, T0));
  const { body } = await tx(db, () => enterQueue(db, bea, T0 + 1));
  let now = T0;
  let moves = 0;
  for (;;) {
    now += 1000;
    const peek = (await tx(db, () => viewMatch(db, ada, body.matchId, now))).body;
    if (peek.status === 'finished') break;
    const mover = ids[peek.clockSeat];
    const view = (await tx(db, () => viewMatch(db, mover, body.matchId, now))).body;
    const result = await tx(db, () => submitCommand(db, mover, body.matchId, nextMove(view), now));
    assert.equal(result.status, 200, JSON.stringify(result.body));
    moves += 1;
    assert.ok(moves < 400, 'match did not finish');
  }
  const final = (await tx(db, () => viewMatch(db, ada, body.matchId, now))).body;
  assert.equal(final.status, 'finished');
  assert.ok(['score', 'domination'].includes(final.game.result.reason));
  assert.ok(final.game.players.every((player) => player.turns === 8) || final.game.result.reason === 'domination');
  assert.equal((await db.query(`SELECT count(*)::int AS n FROM match_result WHERE match_id = $1`, [body.matchId])).rows[0].n, 1);
  const changes = await db.query(`SELECT user_id, before_value, after_value FROM rating_change WHERE match_id = $1`, [body.matchId]);
  assert.equal(changes.rows.length, 2);
  assert.equal(changes.rows.reduce((sum, row) => sum + row.after_value - row.before_value, 0), 0);
  const ratings = await db.query(`SELECT user_id, rating, games FROM rating ORDER BY user_id`);
  assert.equal(ratings.rows.length, 2);
  assert.ok(ratings.rows.every((row) => row.games === 1));
  assert.notEqual(final.rating, null);

  const late = await tx(db, () => submitCommand(db, ada, body.matchId, command(final, 'pass'), now + 1000));
  assert.equal(late.status, 409);
  await tx(db, () => viewMatch(db, bea, body.matchId, now + 5 * 60_000));
  assert.ok((await db.query(`SELECT games FROM rating`)).rows.every((row) => row.games === 1), 'rating applied twice');
  assert.equal((await db.query(`SELECT count(*)::int AS n FROM match_result`)).rows[0].n, 1);

  const replayed = await tx(db, () => replay(db, ada, body.matchId, undefined));
  assert.equal(replayed.status, 200);
  assert.equal(replayed.body.total, final.version);
  assert.deepEqual(replayed.body.game, final.game);
  const opening = await tx(db, () => replay(db, ada, body.matchId, '0'));
  assert.equal(opening.body.game.version, 0);
  assert.equal(opening.body.game.players[1 - opening.body.seat].hand, undefined);
  assert.equal((await tx(db, () => replay(db, ids[2], body.matchId, '0'))).status, 404);

  const listed = await tx(db, () => history(db, ada));
  assert.equal(listed.body.matches.length, 1);
  assert.equal(listed.body.matches[0].opponent, 'bea');
  const board = await tx(db, () => leaderboard(db));
  assert.equal(board.body.entries.length, 2);
  assert.ok(board.body.entries[0].rating >= board.body.entries[1].rating);
});

test('reconnecting restores the same seat view and unchanged polls are cheap', async () => {
  const { db, ids } = await setup();
  const [ada, bea] = ids;
  await tx(db, () => enterQueue(db, ada, T0));
  const { body } = await tx(db, () => enterQueue(db, bea, T0 + 1));
  const mover = ids[(await tx(db, () => viewMatch(db, ada, body.matchId, T0))).body.clockSeat];
  const before = (await tx(db, () => viewMatch(db, mover, body.matchId, T0))).body;
  await tx(db, () => submitCommand(db, mover, body.matchId, nextMove(before), T0 + 1000));
  const live = (await tx(db, () => viewMatch(db, ada, body.matchId, T0 + 2000))).body;
  const reconnected = (await tx(db, () => viewMatch(db, ada, body.matchId, T0 + 3000))).body;
  assert.deepEqual(reconnected, live);
  assert.equal(reconnected.deadline, live.deadline, 'reconnect must not reset the clock');
  const unchanged = await tx(db, () => viewMatch(db, ada, body.matchId, T0 + 4000, live.version));
  assert.deepEqual(Object.keys(unchanged.body).sort(), ['deadline', 'unchanged', 'version']);
});

test('private rooms admit exactly one guest', async () => {
  const { db, ids } = await setup();
  const [ada, bea, cy] = ids;
  const room = await tx(db, () => createRoom(db, ada));
  assert.equal(room.status, 201);
  assert.match(room.body.code, /^[A-Z2-9]{6}$/);
  assert.equal((await tx(db, () => createRoom(db, ada))).body.code, room.body.code);
  assert.equal((await tx(db, () => joinRoom(db, ada, room.body.code, T0))).status, 409);
  assert.equal((await tx(db, () => joinRoom(db, bea, 'nope', T0))).status, 400);
  const joined = await tx(db, () => joinRoom(db, bea, room.body.code.toLowerCase(), T0));
  assert.equal(joined.status, 200);
  assert.equal((await tx(db, () => getRoom(db, ada, room.body.code))).body.matchId, joined.body.matchId);
  assert.equal((await tx(db, () => getRoom(db, cy, room.body.code))).status, 404);
  assert.equal((await tx(db, () => joinRoom(db, cy, room.body.code, T0))).status, 409);
  assert.equal((await db.query(`SELECT mode FROM match WHERE id = $1`, [joined.body.matchId])).rows[0].mode, 'private');
});

test('R26 timeout policy: deterministic auto-actions, reset on own move, forfeit on the third consecutive timeout', async () => {
  const opened = openSnapshot(11);
  const game = structuredClone(opened.game);
  game.choices = [{ kind: 'discard', owner: 0, count: 2 }];
  game.players[0].hand = [{ uid: 'a', card: 'deer' }, { uid: 'b', card: 'mouse' }, { uid: 'c', card: 'fox' }];
  assert.deepEqual(timeoutChoice(game, 'x').uids, ['b', 'c']);
  game.choices = [{ kind: 'rest', owner: 1, options: ['wild', 'water'] }];
  assert.equal(timeoutChoice(game, 'x').region, 'water');
  game.choices = [{ kind: 'migration', owner: 1 }];
  assert.equal(timeoutChoice(game, 'x').skip, true);
  game.choices = [{ kind: 'invasion', owner: 0, options: ['forest', 'water', 'wild', 'domain'] }];
  assert.equal(timeoutChoice(game, 'x').region, 'forest');
  assert.deepEqual(elo(1000, 1000, 1), [1016, 984]);
  assert.deepEqual(elo(1000, 1000, 0.5), [1000, 1000]);

  const { db, ids } = await setup();
  const [ada, bea] = ids;
  const room = await tx(db, () => createRoom(db, ada));
  const { body } = await tx(db, () => joinRoom(db, bea, room.body.code, T0));
  const start = (await tx(db, () => viewMatch(db, ada, body.matchId, T0))).body;
  const deadline = Date.parse(start.deadline);
  assert.equal(deadline - T0, start.game.pending ? CHOICE_MS : TURN_MS);
  const overdue = start.clockSeat;

  const justBefore = (await tx(db, () => viewMatch(db, ada, body.matchId, deadline - 1))).body;
  assert.equal(justBefore.version, start.version);
  const afterOne = (await tx(db, () => viewMatch(db, ada, body.matchId, deadline + 1))).body;
  assert.ok(afterOne.version > start.version);
  assert.equal(afterOne.timeouts[overdue], 1);
  const auto = await db.query(`SELECT count(*)::int AS n FROM match_command WHERE match_id = $1 AND (payload_private->>'auto')::boolean`, [body.matchId]);
  assert.ok(auto.rows[0].n >= 1);

  const mover = ids[afterOne.clockSeat];
  const moverView = (await tx(db, () => viewMatch(db, mover, body.matchId, deadline + 2))).body;
  await tx(db, () => submitCommand(db, mover, body.matchId, nextMove(moverView), deadline + 3));
  const reset = (await tx(db, () => viewMatch(db, ada, body.matchId, deadline + 4))).body;
  assert.equal(reset.timeouts[moverView.seat], 0);

  const abandoned = (await tx(db, () => viewMatch(db, ada, body.matchId, deadline + 60 * 60_000))).body;
  assert.equal(abandoned.status, 'finished');
  assert.equal(abandoned.game.result.reason, 'timeout');
  assert.equal(abandoned.timeouts[1 - abandoned.game.result.winner], MAX_TIMEOUTS);
  assert.equal((await db.query(`SELECT count(*)::int AS n FROM rating_change`)).rows[0].n, 0, 'private rooms are unrated');
  const result = (await db.query(`SELECT reason FROM match_result WHERE match_id = $1`, [body.matchId])).rows[0];
  assert.equal(result.reason, 'timeout');
  assert.equal((await db.query(`SELECT status FROM room WHERE match_id = $1`, [body.matchId])).rows[0].status, 'finished');

  const late = expire(openSnapshot(5), T0, T0 + 10 * TURN_MS, randomUUID);
  assert.equal(late.snapshot.game.result.reason, 'timeout');

  const room2 = await tx(db, () => createRoom(db, ada));
  const second = await tx(db, () => joinRoom(db, bea, room2.body.code, T0));
  const view2 = (await tx(db, () => viewMatch(db, ada, second.body.matchId, T0))).body;
  const offTurnUser = ids[1 - view2.clockSeat];
  const offTurn = (await tx(db, () => viewMatch(db, offTurnUser, second.body.matchId, T0))).body;
  const conceded = await tx(db, () => submitCommand(db, offTurnUser, second.body.matchId, command(offTurn, 'concede'), T0 + 5));
  assert.equal(conceded.status, 200);
  assert.equal(conceded.body.view.game.result.reason, 'concession');
  assert.equal(conceded.body.view.game.result.winner, 1 - offTurn.seat);
  assert.equal((await db.query(`SELECT status FROM room WHERE match_id = $1`, [second.body.matchId])).rows[0].status, 'finished');
  assert.equal((await tx(db, () => getRoom(db, ada, room2.body.code))).body.status, 'finished');
  assert.equal((await tx(db, () => joinRoom(db, ids[2], room2.body.code, T0 + 6))).status, 409);
  const nextRoom = await tx(db, () => createRoom(db, ada));
  assert.equal(nextRoom.status, 201);
});
