import { Pool, neonConfig, type PoolClient } from '@neondatabase/serverless';
import ws from 'ws';
import { runtimeEnv } from './config';

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;

function getPool() {
  const { databaseUrl } = runtimeEnv();
  if (!databaseUrl) throw new Error('Missing DATABASE_URL');
  if (!pool) pool = new Pool({ connectionString: databaseUrl, max: 5 });
  return pool;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
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
  }
}
