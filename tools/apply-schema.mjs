import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const schema = read('db/001_initial.sql');
const audit = read('docs/RULES_AUDIT_AND_DIGITAL_RULINGS.md');
const approval = read('decisions/OWNER_RULES_APPROVAL.md');
const cards = JSON.parse(read('data/cards.json'));

if (!/^Status: Approved$/m.test(approval) || /pending owner confirmation/.test(approval)) {
  console.error('decisions/OWNER_RULES_APPROVAL.md does not record a completed approval');
  process.exit(1);
}
for (let i = 1; i <= 26; i += 1) {
  const id = `R${String(i).padStart(2, '0')}`;
  if (!new RegExp(`^\\|\\s*${id}\\s*\\|[^|]*\\|\\s*approve\\s*\\|`, 'm').test(approval)) {
    console.error(`${id} is not approved in decisions/OWNER_RULES_APPROVAL.md`);
    process.exit(1);
  }
}

const contentHash = createHash('sha256').update(audit).update('\n--approval--\n').update(approval).digest('hex');
const catalog = { cards: cards.length, source: 'data/cards.json' };
const digitalRules = {
  status: 'approved',
  rulings: 'R01-R26',
  approval: 'decisions/OWNER_RULES_APPROVAL.md',
  owners: 'Lynx & Terry',
  approvedOn: '2026-10-13',
  ranked: false,
  referenceEngine: 'src/engine.mjs (digital-1.0-draft implementation)',
};

const pool = new Pool({ connectionString: databaseUrl });
const client = await pool.connect();
try {
  const existing = await client.query(`SELECT to_regclass('public.app_user') IS NOT NULL AS present`);
  const applied = !existing.rows[0].present;
  if (applied) await client.query(schema);
  await client.query('BEGIN');
  await client.query(
    `INSERT INTO ruleset (id, content_hash, catalog, digital_rules, approved_at)
     VALUES ('digital-1.0', $1, $2::jsonb, $3::jsonb, '2026-10-13T00:00:00Z')
     ON CONFLICT (id) DO NOTHING`,
    [contentHash, JSON.stringify(catalog), JSON.stringify(digitalRules)],
  );
  const row = await client.query(`SELECT id, content_hash, approved_at, published_at, digital_rules->>'ranked' AS ranked FROM ruleset WHERE id = 'digital-1.0'`);
  if (row.rows[0].content_hash !== contentHash) {
    throw new Error('Stored digital-1.0 hash differs from the current approval files; record a new ruleset version instead of overwriting');
  }
  await client.query('COMMIT');
  const tables = await client.query(`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log(JSON.stringify({ schemaApplied: applied ? 'db/001_initial.sql' : 'already present', publicTables: tables.rows[0].n, ruleset: row.rows[0] }));
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  client.release();
  await pool.end();
}
