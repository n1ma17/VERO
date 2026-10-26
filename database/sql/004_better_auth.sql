-- Better Auth identity model on top of the money tables.
-- Replaces the demo SHA-256 users/sessions with Better Auth's
-- users / sessions / accounts / verifications (camelCase columns, plural names).
-- Money tables keep snake_case; user_id becomes text to match Better Auth ids.

DROP VIEW IF EXISTS v_ledger_entries;
DROP VIEW IF EXISTS v_month_totals;
DROP VIEW IF EXISTS v_installments;

-- Old demo session table (token_hash) cannot coexist with Better Auth sessions.
-- Do not drop the Better Auth `sessions` table on re-apply.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
      AND column_name = 'token_hash'
  ) THEN
    DROP TABLE sessions CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_user_id_fkey;
ALTER TABLE bank_deposits DROP CONSTRAINT IF EXISTS bank_deposits_user_id_fkey;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;

ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE users RENAME COLUMN created_at TO "createdAt";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;

ALTER TABLE users
  ALTER COLUMN id TYPE text USING id::text,
  ALTER COLUMN name TYPE varchar(128);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS username varchar(64),
  ADD COLUMN IF NOT EXISTS role "UserRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS status "UserStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE users
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

ALTER TABLE bills
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE bank_deposits
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE expenses
  ALTER COLUMN user_id TYPE text USING user_id::text;

DO $$ BEGIN
  ALTER TABLE bills
    ADD CONSTRAINT bills_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bank_deposits
    ADD CONSTRAINT bank_deposits_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE expenses
    ADD CONSTRAINT expenses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  "expiresAt" timestamp(3) NOT NULL,
  token varchar(255) NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" varchar(64),
  "userAgent" text,
  "userId" text NOT NULL REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_key ON sessions (token);
CREATE INDEX IF NOT EXISTS sessions_userId_idx ON sessions ("userId");
CREATE INDEX IF NOT EXISTS sessions_expiresAt_idx ON sessions ("expiresAt");

CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY,
  "accountId" varchar(255) NOT NULL,
  "providerId" varchar(64) NOT NULL,
  "userId" text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp(3),
  "refreshTokenExpiresAt" timestamp(3),
  scope text,
  password text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS accounts_providerId_accountId_key
  ON accounts ("providerId", "accountId");
CREATE INDEX IF NOT EXISTS accounts_userId_idx ON accounts ("userId");

CREATE TABLE IF NOT EXISTS verifications (
  id text PRIMARY KEY,
  identifier varchar(320) NOT NULL,
  value varchar(255) NOT NULL,
  "expiresAt" timestamp(3) NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3)
);

CREATE INDEX IF NOT EXISTS verifications_identifier_idx ON verifications (identifier);

CREATE OR REPLACE FUNCTION set_updated_at_camel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_camel();

DROP TRIGGER IF EXISTS sessions_set_updated_at ON sessions;
CREATE TRIGGER sessions_set_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_camel();

DROP TRIGGER IF EXISTS accounts_set_updated_at ON accounts;
CREATE TRIGGER accounts_set_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_camel();

DROP TRIGGER IF EXISTS verifications_set_updated_at ON verifications;
CREATE TRIGGER verifications_set_updated_at
  BEFORE UPDATE ON verifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_camel();

-- Recreate derived reads (same as 003_views.sql) after the user_id type change.
CREATE OR REPLACE VIEW v_installments AS
SELECT
  b.user_id,
  b.id::text || '__' || m.due_year::text || '-' || lpad(m.due_month::text, 2, '0') AS id,
  b.id AS bill_id,
  b.title,
  b.amount,
  m.due_year,
  m.due_month,
  m.due_day,
  m.due_date,
  p.paid_at,
  CASE WHEN l.bill_id IS NULL THEN NULL ELSE b.id::text END AS logo_key,
  CASE
    WHEN p.paid_at IS NOT NULL THEN 'paid'
    WHEN m.due_date < (timezone('Asia/Tehran', now()))::date THEN 'overdue'
    ELSE 'unpaid'
  END AS status
FROM bills AS b
CROSS JOIN LATERAL (
  SELECT
    due.due_year,
    due.due_month,
    due.due_day,
    jalali_to_date(due.due_year, due.due_month, due.due_day) AS due_date
  FROM (
    SELECT
      ((b.start_year * 12 + (b.start_month - 1) + gs.month_offset) / 12)::smallint AS due_year,
      (((b.start_year * 12 + (b.start_month - 1) + gs.month_offset) % 12) + 1)::smallint AS due_month,
      jalali_clamp_day(
        ((b.start_year * 12 + (b.start_month - 1) + gs.month_offset) / 12)::integer,
        (((b.start_year * 12 + (b.start_month - 1) + gs.month_offset) % 12) + 1)::integer,
        b.due_day
      ) AS due_day
    FROM generate_series(0, b.duration_months - 1) AS gs(month_offset)
  ) AS due
) AS m
LEFT JOIN installment_payments AS p
  ON p.bill_id = b.id
 AND p.jalali_year = m.due_year
 AND p.jalali_month = m.due_month
LEFT JOIN bill_logos AS l
  ON l.bill_id = b.id;

CREATE OR REPLACE VIEW v_month_totals AS
WITH lines AS (
  SELECT
    user_id,
    booked_year AS jalali_year,
    booked_month AS jalali_month,
    amount AS income,
    0::bigint AS bills,
    0::bigint AS expenses
  FROM bank_deposits
  UNION ALL
  SELECT
    user_id,
    due_year,
    due_month,
    0::bigint,
    amount,
    0::bigint
  FROM v_installments
  UNION ALL
  SELECT
    user_id,
    jalali_year,
    jalali_month,
    0::bigint,
    0::bigint,
    amount
  FROM expenses
),
grouped AS (
  SELECT
    user_id,
    jalali_year,
    jalali_month,
    jalali_year * 12 + (jalali_month - 1) AS month_index,
    sum(income)::bigint AS income,
    sum(bills)::bigint AS bills,
    sum(expenses)::bigint AS expenses
  FROM lines
  GROUP BY user_id, jalali_year, jalali_month
)
SELECT
  user_id,
  jalali_year,
  jalali_month,
  jalali_month_name(jalali_month) AS month_name,
  month_index,
  income,
  bills,
  expenses,
  (income - bills - expenses) AS net,
  sum(income - bills - expenses) OVER (
    PARTITION BY user_id
    ORDER BY month_index
    ROWS UNBOUNDED PRECEDING
  )::bigint AS closing_balance
FROM grouped;

CREATE OR REPLACE VIEW v_ledger_entries AS
WITH lines AS (
  SELECT
    d.user_id,
    'deposit-' || d.id::text AS id,
    'deposit'::text AS kind,
    COALESCE(d.note, 'Bank deposit') AS title,
    CASE
      WHEN d.jalali_year = d.booked_year AND d.jalali_month = d.booked_month THEN NULL
      ELSE 'Arrived ' || jalali_month_name(d.jalali_month) || ' ' || d.jalali_year::text
    END AS detail,
    d.amount,
    d.booked_year AS counted_year,
    d.booked_month AS counted_month,
    d.jalali_year AS year,
    d.jalali_month AS month,
    d.jalali_day AS day,
    NULL::text AS status,
    NULL::text AS installment_id,
    NULL::uuid AS expense_id,
    NULL::expense_category AS category,
    (d.jalali_year * 10000 + d.jalali_month * 100 + d.jalali_day) * 3 AS sort_key,
    d.id AS source_id
  FROM bank_deposits AS d
  UNION ALL
  SELECT
    i.user_id,
    'bill-' || i.id,
    'bill',
    i.title,
    NULL,
    i.amount,
    i.due_year,
    i.due_month,
    i.due_year,
    i.due_month,
    i.due_day,
    i.status,
    i.id,
    NULL::uuid,
    NULL::expense_category,
    (i.due_year * 10000 + i.due_month * 100 + i.due_day) * 3 + 1,
    i.bill_id
  FROM v_installments AS i
  UNION ALL
  SELECT
    e.user_id,
    'expense-' || e.id::text,
    'expense',
    e.title,
    e.note,
    e.amount,
    e.jalali_year,
    e.jalali_month,
    e.jalali_year,
    e.jalali_month,
    e.jalali_day,
    NULL,
    NULL,
    e.id,
    e.category,
    (e.jalali_year * 10000 + e.jalali_month * 100 + e.jalali_day) * 3 + 2,
    e.id
  FROM expenses AS e
)
SELECT
  user_id,
  id,
  kind,
  title,
  detail,
  amount,
  counted_year,
  counted_month,
  year,
  month,
  day,
  status,
  installment_id,
  expense_id,
  category,
  sort_key,
  sum(CASE WHEN kind = 'deposit' THEN amount ELSE -amount END) OVER (
    PARTITION BY user_id
    ORDER BY counted_year, counted_month, sort_key, source_id
    ROWS UNBOUNDED PRECEDING
  )::bigint AS balance
FROM lines;

INSERT INTO schema_migrations (version)
VALUES ('004_better_auth')
ON CONFLICT (version) DO NOTHING;
