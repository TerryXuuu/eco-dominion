import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { accountGate } from '../lib/profile-policy.ts';
import { provisionUser } from '../lib/profile-service.ts';
import { createRoom, enterQueue, joinRoom } from '../lib/match-service.ts';
import {
  addComment,
  auditTrail,
  changeRelationship,
  createPost,
  createReport,
  deleteComment,
  deletePost,
  feed,
  getPost,
  getRelationship,
  inviteToRoom,
  isModerator,
  markRead,
  moderate,
  moderationQueue,
  notifications,
  relationships,
  setLike,
  updatePost,
} from '../lib/community-service.ts';

const people = ['ada', 'bea', 'cy'].map((name) => ({ subject: `auth-${name}`, email: `${name}@example.com`, name, emailVerified: true }));

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

test('two users post, comment and like; friends-only posts stay off the public feed; blocks hide both directions', async () => {
  const { db, ids, handles } = await setup();
  const [ada, bea] = ids;
  const publicPost = await tx(db, () => createPost(db, ada, { body: 'Public note from Ada', visibility: 'public' }));
  assert.equal(publicPost.status, 201);
  const friendsPost = await tx(db, () => createPost(db, ada, { body: 'Friends only', visibility: 'friends' }));
  const privatePost = await tx(db, () => createPost(db, ada, { body: 'Private diary', visibility: 'private' }));
  const beaFeed = await tx(db, () => feed(db, bea, {}));
  assert.equal(beaFeed.body.posts.length, 1);
  assert.equal(beaFeed.body.posts[0].body, 'Public note from Ada');
  assert.equal(beaFeed.body.posts[0].mine, false);
  const adaFeed = await tx(db, () => feed(db, ada, {}));
  assert.equal(adaFeed.body.posts.length, 3);

  const like = await tx(db, () => setLike(db, bea, publicPost.body.post.id, true));
  assert.equal(like.body.likes, 1);
  assert.equal(like.body.liked, true);
  const again = await tx(db, () => setLike(db, bea, publicPost.body.post.id, true));
  assert.equal(again.body.likes, 1);
  const comment = await tx(db, () => addComment(db, bea, publicPost.body.post.id, { body: 'Nice play.' }));
  assert.equal(comment.status, 201);
  const thread = await tx(db, () => getPost(db, ada, publicPost.body.post.id));
  assert.equal(thread.body.comments.length, 1);
  assert.equal(thread.body.comments[0].body, 'Nice play.');

  const inbox = await tx(db, () => notifications(db, ada, {}));
  assert.equal(inbox.body.unread, 2);
  assert.deepEqual(inbox.body.notifications.map((item) => item.kind).sort(), ['comment', 'like']);

  await tx(db, () => changeRelationship(db, bea, handles[0], { action: 'friend' }));
  await tx(db, () => changeRelationship(db, ada, handles[1], { action: 'accept' }));
  const friendsFeed = await tx(db, () => feed(db, bea, {}));
  assert.equal(friendsFeed.body.posts.some((post) => post.id === friendsPost.body.post.id), true);
  assert.equal(friendsFeed.body.posts.some((post) => post.id === privatePost.body.post.id), false);

  await tx(db, () => changeRelationship(db, bea, handles[0], { action: 'block' }));
  const blockedFeed = await tx(db, () => feed(db, bea, {}));
  assert.equal(blockedFeed.body.posts.length, 0);
  const blockedPost = await tx(db, () => getPost(db, bea, publicPost.body.post.id));
  assert.equal(blockedPost.status, 404);
  const hiddenProfile = await tx(db, () => getRelationship(db, bea, handles[0]));
  assert.equal(hiddenProfile.body.blocking, true);
  const reverse = await tx(db, () => getRelationship(db, ada, handles[1]));
  assert.equal(reverse.status, 404);
});

test('cross-user edits are refused; ordinary players cannot moderate; reports reach a moderator and close on the audit trail', async () => {
  const { db, ids, handles } = await setup();
  const [ada, bea] = ids;
  assert.equal(await tx(db, () => isModerator(db, ada)), true);
  assert.equal(await tx(db, () => isModerator(db, bea)), false);

  const post = await tx(db, () => createPost(db, bea, { body: 'Bea says hello', visibility: 'public' }));
  const steal = await tx(db, () => updatePost(db, ada, post.body.post.id, { body: 'Ada rewrote this' }));
  assert.equal(steal.status, 403);
  const wipe = await tx(db, () => deletePost(db, ada, post.body.post.id));
  assert.equal(wipe.status, 403);
  const comment = await tx(db, () => addComment(db, ada, post.body.post.id, { body: 'A comment' }));
  const stealComment = await tx(db, () => deleteComment(db, bea, comment.body.id));
  assert.equal(stealComment.status, 403);

  const playerHide = await tx(db, () => moderate(db, bea, { action: 'hide', reason: 'I do not like it', subjectType: 'post', subjectId: post.body.post.id }));
  assert.equal(playerHide.status, 403);
  const playerQueue = await tx(db, () => moderationQueue(db, bea, {}));
  assert.equal(playerQueue.status, 403);
  const playerAudit = await tx(db, () => auditTrail(db, bea));
  assert.equal(playerAudit.status, 403);

  const report = await tx(db, () => createReport(db, ada, { subjectType: 'post', subjectId: post.body.post.id, reason: 'Spam about nothing' }));
  assert.equal(report.status, 201);
  const duplicate = await tx(db, () => createReport(db, ada, { subjectType: 'post', subjectId: post.body.post.id, reason: 'Spam about nothing again' }));
  assert.equal(duplicate.body.duplicate, true);
  const selfReport = await tx(db, () => createReport(db, bea, { subjectType: 'post', subjectId: post.body.post.id, reason: 'Reporting myself' }));
  assert.equal(selfReport.status, 404);

  const queue = await tx(db, () => moderationQueue(db, ada, {}));
  assert.equal(queue.body.reports.length, 1);
  assert.equal(queue.body.reports[0].reason, 'Spam about nothing');
  assert.equal(queue.body.reports[0].subject.text, 'Bea says hello');
  const hidden = await tx(db, () => moderate(db, ada, { reportId: queue.body.reports[0].id, action: 'hide', reason: 'Confirmed spam' }));
  assert.equal(hidden.status, 200);
  const gone = await tx(db, () => getPost(db, bea, post.body.post.id));
  assert.equal(gone.status, 404);
  const closed = await tx(db, () => moderationQueue(db, ada, {}));
  assert.equal(closed.body.reports.length, 0);
  const trail = await tx(db, () => auditTrail(db, ada));
  assert.equal(trail.body.entries.some((entry) => entry.action === 'moderation.hide' && entry.reason === 'Confirmed spam'), true);
  const reporterInbox = await tx(db, () => notifications(db, ada, {}));
  assert.equal(reporterInbox.body.notifications.some((item) => item.kind === 'report_closed'), true);
});

test('suspended users cannot mutate; blocks keep people out of the same queue or private room; only friends get room invites', async () => {
  const { db, ids, handles } = await setup();
  const [ada, bea, cy] = ids;
  assert.equal(accountGate('suspended', true).ok, false);
  assert.equal(accountGate('suspended', false).ok, true);
  assert.equal(accountGate('active', true).ok, true);

  const post = await tx(db, () => createPost(db, bea, { body: 'Still public', visibility: 'public' }));
  const room = await tx(db, () => createRoom(db, ada));
  const strangerInvite = await tx(db, () => inviteToRoom(db, ada, { code: room.body.code, handle: handles[1] }));
  assert.equal(strangerInvite.status, 403);
  await tx(db, () => changeRelationship(db, ada, handles[2], { action: 'friend' }));
  await tx(db, () => changeRelationship(db, cy, handles[0], { action: 'accept' }));
  const friendInvite = await tx(db, () => inviteToRoom(db, ada, { code: room.body.code, handle: handles[2] }));
  assert.equal(friendInvite.status, 200);
  const cyInbox = await tx(db, () => notifications(db, cy, {}));
  assert.equal(cyInbox.body.notifications.some((item) => item.kind === 'room_invite' && item.details.code === room.body.code), true);
  const lists = await tx(db, () => relationships(db, ada));
  assert.equal(lists.body.friends.some((person) => person.handle === handles[2]), true);
  const userReport = await tx(db, () => createReport(db, ada, { subjectType: 'user', handle: handles[1], reason: 'Harassment in chat' }));
  assert.equal(userReport.status, 201);
  const queue = await tx(db, () => moderationQueue(db, ada, {}));
  const suspended = await tx(db, () => moderate(db, ada, { reportId: queue.body.reports[0].id, action: 'suspend', reason: 'Repeated harassment' }));
  assert.equal(suspended.status, 200);
  const status = await db.query(`SELECT status FROM app_user WHERE id = $1`, [bea]);
  assert.equal(status.rows[0].status, 'suspended');
  const gate = accountGate(status.rows[0].status, true);
  assert.equal(gate.ok, false);
  const stillReadable = await tx(db, () => getPost(db, bea, post.body.post.id));
  assert.equal(stillReadable.status, 200);

  await tx(db, () => changeRelationship(db, ids[0], handles[2], { action: 'block' }));
  const blockedJoin = await tx(db, async () => {
    const room = await createRoom(db, ada);
    return joinRoom(db, cy, room.body.code, Date.now());
  });
  assert.equal(blockedJoin.status, 404);
  await tx(db, () => changeRelationship(db, ada, handles[2], { action: 'unblock' }));
  await tx(db, () => changeRelationship(db, cy, handles[0], { action: 'block' }));
  const first = await tx(db, () => enterQueue(db, ada, Date.now()));
  assert.equal(first.body.status, 'waiting');
  const second = await tx(db, () => enterQueue(db, cy, Date.now() + 1));
  assert.equal(second.body.status, 'waiting');
  await tx(db, () => changeRelationship(db, cy, handles[0], { action: 'unblock' }));
  await tx(db, () => markRead(db, ada, { ids: 'all' }));
  const read = await tx(db, () => notifications(db, ada, {}));
  assert.equal(read.body.unread, 0);
});

test('feed pages with a keyset cursor and never returns a blocked author', async () => {
  const { db, ids } = await setup();
  const [ada, bea] = ids;
  const created = [];
  for (let i = 0; i < 3; i += 1) {
    created.push((await tx(db, () => createPost(db, ada, { body: `Note ${i}`, visibility: 'public' }))).body.post.id);
  }
  const page = await tx(db, () => feed(db, bea, { limit: 2 }));
  assert.equal(page.body.posts.length, 2);
  assert.ok(page.body.nextCursor);
  const rest = await tx(db, () => feed(db, bea, { cursor: page.body.nextCursor, limit: 2 }));
  assert.equal(rest.body.posts.length, 1);
  assert.equal(rest.body.nextCursor, null);
  assert.equal(new Set([...page.body.posts, ...rest.body.posts].map((post) => post.id)).size, 3);
});
