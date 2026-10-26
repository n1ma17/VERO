/**
 * Applies ../database/sql/*.sql in filename order.
 * Applied files are tracked in schema_migrations, so re-running is safe.
 */
import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(root, '..', 'database', 'sql');

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required.');
  }

  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No .sql files found in ${migrationsDir}`);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query<{ version: string }>(
      'SELECT version FROM schema_migrations',
    );
    const applied = new Set(rows.map((row) => row.version));

    let count = 0;

    for (const file of files) {
      const version = file.replace(/\.sql$/, '');
      if (applied.has(version)) {
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      console.log(`applying   ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
          [version],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      count += 1;
    }

    console.log(
      count === 0
        ? 'Database schema is up to date.'
        : `Applied ${count} migration(s).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
