import { Pool, neonConfig, type PoolClient } from '@neondatabase/serverless';
import ws from 'ws';
import { runtimeEnv } from './config';

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;

function getPool() {
  const { databaseUrl } = runtimeEnv();
  if (!databaseUrl) throw new Error('Missing DATABASE_URL');
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl, max: 5, idleTimeoutMillis: 120_000, connectionTimeoutMillis: 20_000 });
    pool.query('SELECT 1').catch(() => {
      /* The first real request still connects if this warmup misses. */
    });
  }
  return pool;
}

/** One pooled connection, without BEGIN/COMMIT. Reads stay one network round trip. */
export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
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
