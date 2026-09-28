import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from './index';

export const pool = new Pool({
  connectionString: config.db.url,
  max: config.db.maxConnections,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
});

pool.on('error', (err) => {
  console.error('[DB_POOL_ERROR] Unexpected error on idle client:', err.message);
});

export const db = {
  query: async <T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
    const start = Date.now();
    try {
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL === 'true') {
        console.log(`[SQL_QUERY] ${duration}ms | ${text} | params: ${JSON.stringify(params)}`);
      }
      return res;
    } catch (error: any) {
      console.error(`[SQL_ERROR] Query failed: ${text}`, error.message);
      throw error;
    }
  },

  getClient: async (): Promise<PoolClient> => {
    return await pool.connect();
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await pool.query('SELECT 1 as healthy');
      return res.rows.length > 0 && res.rows[0].healthy === 1;
    } catch (err) {
      return false;
    }
  }
};
