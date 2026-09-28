import { db, pool } from '../config/database';
import { runMigrations } from './migrate';
import { runSeed } from './seed';

export const runReset = async () => {
  console.log('⚠️  Resetting database schema and platform state...');
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO PUBLIC;');
    await client.query('COMMIT');
    console.log('✅ Schema public recreated.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to reset schema:', err.message);
    throw err;
  } finally {
    client.release();
  }

  await runMigrations();
  await runSeed();
  console.log('✨ Platform database reset, migrated, and seeded!');
};

if (require.main === module) {
  runReset()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
