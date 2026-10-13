import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { accountGate } from '../lib/profile-policy.ts';
import { provisionUser } from '../lib/profile-service.ts';
import { changeRelationship, createPost, createReport, feed, getPost, moderate, moderationQueue, setLike } from '../lib/community-service.ts';
import { enterQueue, replay, submitCommand, viewMatch } from '../lib/match-service.ts';

const people = ['ada', 'bea', 'cy'].map((name) => ({ subject: `auth-${name}`, email: `${name}@example.com`, name, emailVerified: true }));
const T0 = Date.parse('2026-10-13T14:00:00Z');

async function setup() {
  const db = new PGlite();
  await db.exec(readFileSync(new URL('../db/001_initial.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../db/002_play.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../db/003_community.sql', import.meta.url), 'utf8'));
  await db.query(`INSERT INTO ruleset (id, content_hash, catalog, digital_rules, approved_at) VALUES ('digital-1.0', 'test', '{}', '{"ranked":false}', now())`);
  const ids = [];
  const handles = [];
  for (const person of people) {
    const row = await provisionUser(db, person);
    ids.push(row.user_id);
    handles.push(row.handle);
  }
  await db.query(`INSERT INTO user_role (user_id, role) VALUES ($1, 'moderator')`, [ids[0]]);
  return { db, ids, handles };
}

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
function pass(view) {
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

test('one journey: casual match, public post, like, then a block that hides the feed and stops rematching', async () => {
  const { db, ids, handles } = await setup();
  const [ada, bea] = ids;
  const queued = await tx(db, () => enterQueue(db, ada, T0));
  const paired = await tx(db, () => enterQueue(db, bea, T0 + 1));
  assert.equal(paired.body.status, 'matched');
  const matchId = paired.body.matchId;
  const peek = (await tx(db, () => viewMatch(db, ada, matchId, T0 + 2))).body;
  const mover = ids[peek.clockSeat];
  const first = (await tx(db, () => viewMatch(db, mover, matchId, T0 + 2))).body;
  const move = pass(first);
  const once = await tx(db, () => submitCommand(db, mover, matchId, move, T0 + 2));
  assert.equal(once.status, 200);
  const again = await tx(db, () => submitCommand(db, mover, matchId, move, T0 + 3));
  assert.equal(again.body.duplicate, true);
  assert.equal(again.body.view.version, once.body.view.version);

  const post = await tx(db, () => createPost(db, ada, { body: 'Watching this match', visibility: 'public' }));
  const like = await tx(db, () => setLike(db, bea, post.body.post.id, true));
  assert.equal(like.body.likes, 1);

  await tx(db, () => changeRelationship(db, bea, handles[0], { action: 'block' }));
  const hidden = await tx(db, () => feed(db, bea, {}));
  assert.equal(hidden.body.posts.length, 0);
  const thread = await tx(db, () => getPost(db, bea, post.body.post.id));
  assert.equal(thread.status, 404);
  const live = (await tx(db, () => viewMatch(db, ada, matchId, T0 + 9))).body;
  await tx(db, () => submitCommand(db, ada, matchId, command(live, 'concede'), T0 + 9));
  const rematchAda = await tx(db, () => enterQueue(db, ada, T0 + 10));
  const rematchBea = await tx(db, () => enterQueue(db, bea, T0 + 11));
  assert.equal(rematchAda.body.status, 'waiting');
  assert.equal(rematchBea.body.status, 'waiting');
});

test('suspended players can read and cannot queue, command, post or follow; replay of a finished match matches the stored version', async () => {
  const { db, ids, handles } = await setup();
  const [ada, bea] = ids;
  await tx(db, () => enterQueue(db, ada, T0));
  const paired = await tx(db, () => enterQueue(db, bea, T0 + 1));
  const matchId = paired.body.matchId;
  let now = T0 + 2;
  let moves = 0;
  for (;;) {
    now += 1000;
    const peek = (await tx(db, () => viewMatch(db, ada, matchId, now))).body;
    if (peek.status === 'finished') break;
    const mover = ids[peek.clockSeat];
    const view = (await tx(db, () => viewMatch(db, mover, matchId, now))).body;
    const result = await tx(db, () => submitCommand(db, mover, matchId, pass(view), now));
    assert.equal(result.status, 200, JSON.stringify(result.body));
    moves += 1;
    assert.ok(moves < 400, 'match did not finish');
  }
  const finished = await tx(db, () => viewMatch(db, ada, matchId, now));
  assert.equal(finished.body.status, 'finished');
  const recap = await tx(db, () => replay(db, ada, matchId, finished.body.version));
  assert.equal(recap.status, 200);
  assert.equal(recap.body.game.version, finished.body.game.version);
  assert.deepEqual(recap.body.game.result, finished.body.game.result);
  const stranger = await tx(db, () => replay(db, ids[2], matchId, 0));
  assert.equal(stranger.status, 404);

  const report = await tx(db, () => createReport(db, ada, { subjectType: 'user', handle: handles[1], reason: 'Integrated suspend check' }));
  assert.equal(report.status, 201);
  const open = await tx(db, () => moderationQueue(db, ada, {}));
  const suspended = await tx(db, () => moderate(db, ada, { reportId: open.body.reports[0].id, action: 'suspend', reason: 'Integrated suspend check' }));
  assert.equal(suspended.status, 200);
  assert.equal(accountGate('suspended', true).ok, false);
  assert.equal((await tx(db, () => enterQueue(db, bea, now))).status, 403);
  assert.equal((await tx(db, () => createPost(db, bea, { body: 'Should fail', visibility: 'public' }))).status, 403);
  assert.equal((await tx(db, () => changeRelationship(db, bea, handles[0], { action: 'follow' }))).status, 403);
  assert.equal((await tx(db, () => viewMatch(db, bea, matchId, now))).status, 200);
});
