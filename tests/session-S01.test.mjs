import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { canViewProfile, handleFromEmail, parseProfilePatch, sameOrigin } from '../lib/profile-policy.ts';
import { getOwnProfile, provisionUser, updateOwnProfile, viewProfile } from '../lib/profile-service.ts';
import { CORRECTED_ENERGY_EXAMPLE, RULINGS, RULESET_ID, spendSpell } from '../lib/rulings.ts';
import { CARDS, apply, newGame, project } from '../src/engine.mjs';

const ada = { subject: 'auth-ada', email: 'ada@example.com', name: 'Ada', emailVerified: true };
const bea = { subject: 'auth-bea', email: 'bea@example.com', name: 'Bea', emailVerified: true };

test('draft rulings and the 36-card baseline stay unapproved', () => {
  assert.equal(CARDS.length, 36);
  assert.equal(new Set(CARDS.map((card) => card.id)).size, 36);
  assert.equal(RULINGS.map((ruling) => ruling.id).join(','), Array.from({ length: 26 }, (_, index) => `R${String(index + 1).padStart(2, '0')}`).join(','));
  assert.equal(RULESET_ID, 'digital-1.0-draft');
  assert.equal(CORRECTED_ENERGY_EXAMPLE.legal.afterDeer.energy, 2);
  assert.equal(CORRECTED_ENERGY_EXAMPLE.legal.afterDeer.reserve, 1);
  assert.deepEqual(CORRECTED_ENERGY_EXAMPLE.legal.afterFortify, { energy: 0, reserve: 0 });
  assert.throws(() => spendSpell(2, 0, 3), /Insufficient energy/);
  assert.equal(handleFromEmail('Ada.Player@example.com'), 'adaplayer');
  assert.equal(parseProfilePatch({ displayName: 'A', bio: 'x'.repeat(281), visibility: 'public', locale: 'zh-CN', handle: 'ada' }).ok, false);
  assert.equal(canViewProfile({ viewerId: 'b', ownerId: 'a', visibility: 'private', friends: true, ownerStatus: 'active' }), false);
  assert.equal(sameOrigin({ headers: { get: (name) => (name === 'origin' ? 'http://localhost:3000' : 'localhost:3000') } }), true);
  assert.equal(sameOrigin({ headers: { get: (name) => (name === 'origin' ? 'https://evil.test' : 'localhost:3000') } }), false);
});

test('engine hides hands and follows the corrected energy and final-turn rulings', () => {
  const opened = newGame(7);
  const first = opened.first;
  const second = 1 - first;
  assert.equal(opened.rules, 'digital-1.0-draft');
  assert.equal(opened.players[first].turns, 1);
  assert.equal(opened.players[first].max, 1);
  assert.equal(opened.players[first].energy, 1);
  assert.equal(opened.players[second].max, 0);
  assert.equal(opened.players[second].energy, 0);
  assert.equal(project(opened, second).players[first].hand, undefined);
  assert.ok(project(opened, first).players[first].hand.length >= 1);

  opened.phase = 'deploy';
  opened.choices = [];
  opened.afterChoices = null;
  opened.active = first;
  opened.players[first].energy = 4;
  opened.players[first].reserve = 0;
  opened.players[first].hand = [{ uid: 'deer-card', card: 'deer' }, { uid: 'fortify-card', card: 'fortify' }];
  const deerOnly = apply(opened, first, { id: 'deer-illegal', type: 'play', version: opened.version, uid: 'deer-card', region: 'forest' });
  assert.equal(deerOnly.players[first].energy, 2);
  assert.equal(deerOnly.players[first].reserve, 0);
  deerOnly.phase = 'tactics';
  deerOnly.choices = [];
  assert.throws(() => apply(deerOnly, first, { id: 'fortify-illegal', type: 'play', version: deerOnly.version, uid: 'fortify-card', region: 'forest' }), /Insufficient energy/);

  const legal = newGame(7);
  legal.phase = 'deploy';
  legal.choices = [];
  legal.afterChoices = null;
  legal.active = first;
  legal.players[first].energy = 4;
  legal.players[first].reserve = 1;
  legal.players[first].hand = [{ uid: 'deer-card', card: 'deer' }, { uid: 'fortify-card', card: 'fortify' }];
  const afterDeer = apply(legal, first, { id: 'deer-legal', type: 'play', version: legal.version, uid: 'deer-card', region: 'forest' });
  assert.equal(afterDeer.players[first].energy, 2);
  assert.equal(afterDeer.players[first].reserve, 1);
  afterDeer.phase = 'tactics';
  afterDeer.choices = [];
  const afterFortify = apply(afterDeer, first, { id: 'fortify-legal', type: 'play', version: afterDeer.version, uid: 'fortify-card', region: 'forest' });
  assert.equal(afterFortify.players[first].energy, 0);
  assert.equal(afterFortify.players[first].reserve, 0);

  const ending = newGame(3);
  ending.phase = 'tactics';
  ending.choices = [];
  ending.afterChoices = null;
  ending.active = 0;
  ending.players[0].turns = 8;
  ending.players[1].turns = 8;
  ending.result = null;
  const scored = apply(ending, 0, { id: 'final-turn', type: 'pass', version: ending.version });
  assert.equal(scored.phase, 'finished');
  assert.equal(scored.result.reason, 'score');
});

test('schema maps two users and refuses private or cross-account changes', async () => {
  const db = new PGlite();
  await db.exec(readFileSync(new URL('../db/001_initial.sql', import.meta.url), 'utf8'));
  const tables = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  const names = tables.rows.map((row) => row.table_name);
  for (const required of ['app_user', 'profile', 'user_role', 'ruleset']) assert.ok(names.includes(required), required);

  assert.equal((await getOwnProfile(db, null)).status, 401);
  await db.exec('BEGIN');
  const first = await getOwnProfile(db, ada);
  const second = await getOwnProfile(db, bea);
  const repeat = await provisionUser(db, ada);
  await db.exec('COMMIT');
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(first.body.email, 'ada@example.com');
  assert.notEqual(first.body.handle, second.body.handle);
  assert.equal(repeat.handle, first.body.handle);
  assert.deepEqual(first.body.roles, ['player']);

  await db.exec('BEGIN');
  const clash = await getOwnProfile(db, { subject: 'other', email: 'Ada@example.com', name: 'Other', emailVerified: false });
  await db.exec('ROLLBACK');
  assert.equal(clash.status, 400);

  const patch = { displayName: 'Ada Forest', bio: 'Canopy notes', visibility: 'private', locale: 'zh-CN', handle: first.body.handle };
  await db.exec('BEGIN');
  const saved = await updateOwnProfile(db, ada, patch, true);
  const denied = await updateOwnProfile(db, ada, { ...patch, bio: 'no' }, false);
  await db.exec('COMMIT');
  assert.equal(saved.status, 200);
  assert.equal(saved.body.displayName, 'Ada Forest');
  assert.equal(denied.status, 403);

  const hidden = await viewProfile(db, bea, first.body.handle);
  assert.equal(hidden.status, 404);
  assert.equal('email' in hidden.body, false);
  const own = await viewProfile(db, ada, first.body.handle);
  assert.equal(own.status, 200);
  assert.equal(own.body.email, 'ada@example.com');

  await db.query(`UPDATE profile SET visibility = 'public' WHERE user_id = (SELECT id FROM app_user WHERE auth_subject = $1)`, [ada.subject]);
  const visible = await viewProfile(db, bea, first.body.handle);
  assert.equal(visible.status, 200);
  assert.equal('email' in visible.body, false);
  assert.equal(visible.body.displayName, 'Ada Forest');

  await db.query(`UPDATE profile SET visibility = 'friends' WHERE user_id = (SELECT id FROM app_user WHERE auth_subject = $1)`, [ada.subject]);
  assert.equal((await viewProfile(db, bea, first.body.handle)).status, 404);
  const ids = await db.query(`SELECT id, auth_subject FROM app_user`);
  const adaId = ids.rows.find((row) => row.auth_subject === ada.subject).id;
  const beaId = ids.rows.find((row) => row.auth_subject === bea.subject).id;
  await db.query(`INSERT INTO friend_request (sender, recipient, status) VALUES ($1, $2, 'accepted')`, [beaId, adaId]);
  const friendly = await viewProfile(db, bea, first.body.handle);
  assert.equal(friendly.status, 200);
  assert.equal('email' in friendly.body, false);

  await db.query(`UPDATE app_user SET status = 'suspended' WHERE auth_subject = $1`, [ada.subject]);
  assert.equal((await viewProfile(db, bea, first.body.handle)).status, 404);
  const suspended = await updateOwnProfile(db, ada, patch, true);
  assert.equal(suspended.status, 403);
  const beaStill = await viewProfile(db, bea, second.body.handle);
  assert.equal(beaStill.body.displayName === 'Ada Forest', false);
});
