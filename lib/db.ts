import { Pool, neonConfig, type PoolClient } from '@neondatabase/serverless';
import ws from 'ws';
import { runtimeEnv } from './config';

neonConfig.webSocketConstructor = ws;

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const { databaseUrl } = runtimeEnv();
  if (!databaseUrl) throw new Error('Missing DATABASE_URL');
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* The connection may already be closed. */
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
