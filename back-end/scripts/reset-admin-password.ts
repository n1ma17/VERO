import 'dotenv/config';
import { hashPassword } from 'better-auth/crypto';
import { Client } from 'pg';

const email = (process.env.ADMIN_EMAIL?.trim() || '').toLowerCase();
const password = process.env.ADMIN_PASSWORD?.trim();
if (!password || password.length < 8) {
  throw new Error('ADMIN_PASSWORD must be set and at least 8 characters.');
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const { rows: users } = await client.query<{
    email: string;
    name: string;
    username: string | null;
  }>('SELECT email, name, username FROM users ORDER BY email');
  console.log('users:');
  for (const user of users) {
    console.log(`- ${user.email} (${user.name}${user.username ? `, ${user.username}` : ''})`);
  }

  const hash = await hashPassword(password);
  const updated = await client.query<{ email: string }>(
    `UPDATE accounts a
        SET password = $1, "updatedAt" = NOW()
      FROM users u
     WHERE a."userId" = u.id
       AND u.email = $2
       AND a."providerId" = 'credential'
     RETURNING u.email`,
    [hash, email],
  );
  if (updated.rowCount !== 1) {
    throw new Error(`Password reset matched ${updated.rowCount ?? 0} account(s) for ${email}.`);
  }
  console.log(`password restored from ADMIN_PASSWORD for ${updated.rows[0].email}`);
} finally {
  await client.end();
}
