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

const schema = readFileSync(new URL('../db/001_initial.sql', import.meta.url), 'utf8');
const rulings = readFileSync(new URL('../docs/RULES_AUDIT_AND_DIGITAL_RULINGS.md', import.meta.url), 'utf8');
const cards = readFileSync(new URL('../data/cards.json', import.meta.url), 'utf8');
const contentHash = createHash('sha256').update(rulings).digest('hex');
const catalog = { cards: JSON.parse(cards).length, source: 'data/cards.json' };
const digitalRules = { status: 'draft', rulings: 'R01-R26', approval: 'pending-owner' };

const pool = new Pool({ connectionString: databaseUrl });
const client = await pool.connect();
try {
  await client.query(schema);
  await client.query(
    `INSERT INTO ruleset (id, content_hash, catalog, digital_rules)
     VALUES ('digital-1.0-draft', $1, $2::jsonb, $3::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [contentHash, JSON.stringify(catalog), JSON.stringify(digitalRules)],
  );
  const check = await client.query(`SELECT id, approved_at IS NULL AS still_draft FROM ruleset WHERE id = 'digital-1.0-draft'`);
  console.log(JSON.stringify({ applied: 'db/001_initial.sql', ruleset: check.rows[0] }));
} finally {
  client.release();
  await pool.end();
}
