// Operator tool: grant or revoke a moderator/admin role, with an audit record. Roles are owner decisions; record them in decisions/DECISIONS.md.
// Usage: node --env-file=.env tools/grant-role.mjs <handle> <moderator|admin> [--revoke]
import { randomUUID } from 'node:crypto';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const [handle, role, flag] = process.argv.slice(2);
if (!handle || !['moderator', 'admin'].includes(role) || (flag && flag !== '--revoke')) {
  console.error('Usage: node --env-file=.env tools/grant-role.mjs <handle> <moderator|admin> [--revoke]');
  process.exit(1);
}
const revoke = flag === '--revoke';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const user = (await client.query(`SELECT id, handle, status FROM app_user WHERE lower(handle) = lower($1)`, [handle])).rows[0];
  if (!user || user.status === 'deleted') throw new Error(`No active account @${handle}`);
  const changed = revoke
    ? await client.query(`DELETE FROM user_role WHERE user_id = $1 AND role = $2 RETURNING role`, [user.id, role])
    : await client.query(`INSERT INTO user_role (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING role`, [user.id, role]);
  if (changed.rows[0]) {
    await client.query(
      `INSERT INTO audit_log (id, actor_id, action, subject_type, subject_id, metadata) VALUES ($1, NULL, $2, 'app_user', $3, $4::jsonb)`,
      [randomUUID(), revoke ? 'role.revoke' : 'role.grant', user.id, JSON.stringify({ role, by: 'operator' })],
    );
  }
  await client.query('COMMIT');
  const roles = (await client.query(`SELECT role FROM user_role WHERE user_id = $1 ORDER BY role`, [user.id])).rows.map((row) => row.role);
  console.log(JSON.stringify({ handle: user.handle, changed: Boolean(changed.rows[0]), roles }));
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(error.message);
  process.exitCode = 1;
} finally {
  client.release();
  pool.end().catch(() => {});
}
