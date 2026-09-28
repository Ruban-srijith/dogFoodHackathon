import fs from 'fs';
import path from 'path';
import { db, pool } from '../config/database';

export const runMigrations = async () => {
  console.log('🔄 Starting database migrations...');

  const migrationsDir = path.resolve(__dirname, '../../../database/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Migrations directory not found at ${migrationsDir}`);
    process.exit(1);
  }

  // Create migrations tracking table if not exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const executedRes = await db.query<{ filename: string }>('SELECT filename FROM schema_migrations');
  const executedFiles = new Set(executedRes.rows.map((r) => r.filename));

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (executedFiles.has(file)) {
      console.log(`⏩ Skipping already applied migration: ${file}`);
      continue;
    }

    console.log(`⚡ Applying migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✅ Applied: ${file}`);
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed migration ${file}:`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('🎉 All migrations applied successfully!');
};

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
