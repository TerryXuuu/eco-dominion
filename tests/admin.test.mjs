import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { adminAct, adminOverview } from '../lib/admin-service.ts';
import { provisionUser } from '../lib/profile-service.ts';

const people = ['ada', 'bea'].map((name) => ({ subject: `auth-${name}`, email: `${name}@example.com`, name, emailVerified: true }));

async function setup() {
  const db = new PGlite();
  await db.exec(readFileSync(new URL('../db/001_initial.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../db/002_play.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../db/003_community.sql', import.meta.url), 'utf8'));
  const ids = [];
  for (const person of people) ids.push((await provisionUser(db, person)).user_id);
  await db.query(`INSERT INTO user_role (user_id, role) VALUES ($1, 'moderator'), ($1, 'admin')`, [ids[0]]);
  return { db, ids };
}

test('only an admin can open the console, grant a role, and adjust a casual rating', async () => {
  const { db, ids } = await setup();
  const [ada, bea] = ids;
  assert.equal((await adminOverview(db, bea)).status, 403);

  const overview = await adminOverview(db, ada, 'bea');
  assert.equal(overview.status, 200);
  assert.equal(overview.body.people.length, 1);
  assert.equal(overview.body.people[0].email, 'bea@example.com');
  assert.deepEqual(overview.body.people[0].roles, ['player']);
  assert.equal(overview.body.people[0].rating, 1000);

  const granted = await adminAct(db, ada, { kind: 'role', handle: 'bea', role: 'moderator', reason: 'Community help' });
  assert.equal(granted.status, 200);
  assert.ok(granted.body.people.find((person) => person.handle === 'bea').roles.includes('moderator'));
  assert.equal((await adminAct(db, ada, { kind: 'role', handle: 'bea', role: 'moderator', reason: 'Again' })).status, 409);

  const rating = await adminAct(db, ada, { kind: 'rating', handle: 'bea', rating: 1200, reason: 'Correct a missed game' });
  assert.equal(rating.status, 200);
  const beaRow = rating.body.people.find((person) => person.handle === 'bea');
  assert.equal(beaRow.rating, 1200);
  assert.equal(beaRow.games, 0);
  assert.equal((await db.query(`SELECT count(*)::int AS n FROM rating_change`)).rows[0].n, 0);
  const audit = (await db.query(`SELECT metadata FROM audit_log WHERE action = 'rating.adjust'`)).rows[0];
  const metadata = typeof audit.metadata === 'string' ? JSON.parse(audit.metadata) : audit.metadata;
  assert.equal(metadata.before, 1000);
  assert.equal(metadata.after, 1200);

  assert.equal((await adminAct(db, ada, { kind: 'role', handle: 'ada', role: 'admin', revoke: true, reason: 'Step down' })).status, 403);
  assert.equal((await adminAct(db, ada, { kind: 'account', handle: 'ada', action: 'suspend', reason: 'Lock myself' })).status, 403);
  assert.equal((await adminAct(db, bea, { kind: 'rating', handle: 'ada', rating: 1, reason: 'Not allowed' })).status, 403);
  assert.equal((await adminAct(db, ada, { kind: 'rating', handle: 'bea', rating: 5000, reason: 'Too high' })).status, 400);

  const suspended = await adminAct(db, ada, { kind: 'account', handle: 'bea', action: 'suspend', reason: 'Abusive reports' });
  assert.equal(suspended.status, 200);
  assert.equal(suspended.body.people.find((person) => person.handle === 'bea').status, 'suspended');
});
