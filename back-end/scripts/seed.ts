/**
 * Seeds the admin account and loads initial wallet data from an Excel backup.
 * Idempotent: existing email is updated in place; wallet import replaces money rows.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from 'better-auth/crypto';
import { Client } from 'pg';
import { loadBackupFromFile } from './lib/backup-xlsx.js';
import { importWalletSnapshot } from './lib/import-wallet-snapshot.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..', '..');
const defaultBackup = join(repoRoot, 'money-management-backup-2026-10-26.xlsx');

function resolveBackupPath(): string {
  const fromEnv = process.env.ADMIN_BACKUP_XLSX?.trim();
  const path = fromEnv || defaultBackup;
  if (!existsSync(path)) {
    throw new Error(
      `Admin backup Excel not found at ${path}. Set ADMIN_BACKUP_XLSX or place money-management-backup-2026-10-26.xlsx in the repo root.`,
    );
  }
  return path;
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run the seed.');
  }

  const name = process.env.ADMIN_NAME?.trim() || 'Nima Abbasi';
  const email = (process.env.ADMIN_EMAIL?.trim() || 'nimaab1992@gmail.com').toLowerCase();
  const username = process.env.ADMIN_USERNAME?.trim() || 'nimaabbasi';
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password || password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be set and at least 8 characters.');
  }

  const backupPath = resolveBackupPath();
  const snapshot = loadBackupFromFile(backupPath);

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const passwordHash = await hashPassword(password);
    const { rows: existing } = await client.query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );

    let userId = existing[0]?.id;
    if (!userId) {
      userId = randomUUID();
      await client.query(
        `INSERT INTO users
           (id, name, email, "emailVerified", username, role, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, $4, 'ADMIN', 'ACTIVE', NOW(), NOW())`,
        [userId, name, email, username],
      );
    } else {
      await client.query(
        `UPDATE users
            SET name = $2,
                username = $3,
                role = 'ADMIN',
                status = 'ACTIVE',
                "emailVerified" = true
          WHERE id = $1`,
        [userId, name, username],
      );
    }

    await client.query(
      `INSERT INTO accounts
         (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())
       ON CONFLICT ("providerId", "accountId") DO UPDATE
          SET password = EXCLUDED.password,
              "updatedAt" = NOW()`,
      [randomUUID(), userId, userId, passwordHash],
    );

    await importWalletSnapshot(client, userId, snapshot);

    console.log(`Admin ready: ${name} <${email}>`);
    console.log(
      `Wallet imported from ${backupPath}: ${snapshot.bills.length} bill(s), ${snapshot.deposits.length} deposit(s), ${snapshot.expenses.length} expense(s), ${snapshot.payments.length} payment(s), ${snapshot.logos.length} logo(s).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
