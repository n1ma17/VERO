-- Relational model for the money app.
-- Amounts are integer Iranian Toman (never fractional).
-- Installment rows are not stored. A bill defines a span; only a payment
-- (paid_at) is a fact. Overdue is derived. See 003_views.sql.
--
-- The Vue app currently keeps one shared localStorage wallet. These tables
-- are per user, so two accounts do not share books once an API exists.

DO $$
BEGIN
  CREATE DOMAIN jalali_year AS smallint
    CHECK (VALUE BETWEEN 1200 AND 1600);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE DOMAIN jalali_month AS smallint
    CHECK (VALUE BETWEEN 1 AND 12);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE DOMAIN jalali_day AS smallint
    CHECK (VALUE BETWEEN 1 AND 31);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE DOMAIN toman AS bigint
    CHECK (VALUE > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE expense_category AS ENUM (
    'food',
    'groceries',
    'home',
    'clothing',
    'entertainment',
    'transport',
    'car',
    'motorcycle',
    'beauty',
    'health',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  email text NOT NULL CHECK (
    email = lower(email)
    AND char_length(email) BETWEEN 3 AND 320
    AND position('@' IN email) > 1
  ),
  -- Unsalted SHA-256 hex, same as the current client (`hashSecret`).
  -- This is a password-equivalent. Replace it before any shared deployment.
  password_hash text NOT NULL CHECK (password_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_key UNIQUE (email)
);

COMMENT ON TABLE users IS
  'Accounts. Front localStorage key: money-managment:users.';
COMMENT ON COLUMN users.password_hash IS
  'Unsalted SHA-256 hex produced by the Vue client. Not a production password store.';

-- Server stand-in for money-managment:session. The Vue app does not write
-- this table yet; it still keeps {userId, name, email} in localStorage.
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT sessions_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS sessions_active_user_idx
  ON sessions (user_id)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  amount toman NOT NULL,
  -- First and last due dates (Gregorian). Installments expand by Jalali month.
  start_on date NOT NULL,
  end_on date NOT NULL,
  -- Nominal Jalali day of month. Shorter months clamp it in v_installments.
  due_day jalali_day NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bills_end_on_after_start CHECK (end_on >= start_on),
  CONSTRAINT bills_duration_months CHECK (
    jalali_month_index(end_on) - jalali_month_index(start_on) BETWEEN 0 AND 59
  ),
  CONSTRAINT bills_due_day_in_start_month CHECK (
    due_day <= jalali_month_length(jalali_year(start_on), jalali_month(start_on))
  )
);

COMMENT ON TABLE bills IS
  'Recurring bill definitions. start_on/end_on are Gregorian dates; months are Jalali.';

CREATE INDEX IF NOT EXISTS bills_user_start_idx
  ON bills (user_id, start_on);

-- Replaces the IndexedDB `bill-logos` store. The front's logoKey is the bill id.
CREATE TABLE IF NOT EXISTS bill_logos (
  bill_id uuid PRIMARY KEY REFERENCES bills (id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN (
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  )),
  bytes bytea NOT NULL CHECK (octet_length(bytes) BETWEEN 1 AND 131072),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE bill_logos IS
  'Optional institution logo, max 128 KB, same cap as MAX_BILL_LOGO_BYTES.';

-- The only persisted installment fact. Keyed by the Gregorian due date.
CREATE TABLE IF NOT EXISTS installment_payments (
  bill_id uuid NOT NULL REFERENCES bills (id) ON DELETE CASCADE,
  due_on date NOT NULL,
  paid_at timestamptz NOT NULL,
  PRIMARY KEY (bill_id, due_on)
);

COMMENT ON TABLE installment_payments IS
  'Absence of a row means unpaid. Overdue is not stored. due_on is Gregorian.';

CREATE TABLE IF NOT EXISTS bank_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount toman NOT NULL,
  arrived_on date NOT NULL,
  booked_on date NOT NULL,
  note text CHECK (note IS NULL OR char_length(btrim(note)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE bank_deposits IS
  'arrived_on is the bank date. booked_on is the Gregorian date of Jalali day 1 of the counted month.';

CREATE INDEX IF NOT EXISTS bank_deposits_booked_idx
  ON bank_deposits (user_id, booked_on);

CREATE INDEX IF NOT EXISTS bank_deposits_user_created_idx
  ON bank_deposits (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  amount toman NOT NULL,
  category expense_category NOT NULL,
  occurred_on date NOT NULL,
  note text CHECK (note IS NULL OR char_length(btrim(note)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE expenses IS
  'Purchase date is Gregorian occurred_on. Counted in that date''s Jalali month.';

CREATE INDEX IF NOT EXISTS expenses_month_idx
  ON expenses (user_id, occurred_on);

CREATE INDEX IF NOT EXISTS expenses_category_idx
  ON expenses (user_id, category);

CREATE INDEX IF NOT EXISTS expenses_user_created_idx
  ON expenses (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS bills_set_updated_at ON bills;
CREATE TRIGGER bills_set_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS bill_logos_set_updated_at ON bill_logos;
CREATE TRIGGER bill_logos_set_updated_at
  BEFORE UPDATE ON bill_logos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS bank_deposits_set_updated_at ON bank_deposits;
CREATE TRIGGER bank_deposits_set_updated_at
  BEFORE UPDATE ON bank_deposits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS expenses_set_updated_at ON expenses;
CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION installment_payment_inside_bill()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  start_index integer;
  end_index integer;
  pay_index integer;
BEGIN
  SELECT
    jalali_month_index(b.start_on),
    jalali_month_index(b.end_on)
  INTO start_index, end_index
  FROM bills AS b
  WHERE b.id = NEW.bill_id;

  IF start_index IS NULL THEN
    RAISE EXCEPTION 'bill % does not exist', NEW.bill_id;
  END IF;

  pay_index := jalali_month_index(NEW.due_on);
  IF pay_index < start_index OR pay_index > end_index THEN
    RAISE EXCEPTION 'payment % is outside the bill span', NEW.due_on;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS installment_payments_inside_bill ON installment_payments;
CREATE TRIGGER installment_payments_inside_bill
  BEFORE INSERT OR UPDATE ON installment_payments
  FOR EACH ROW EXECUTE FUNCTION installment_payment_inside_bill();

CREATE OR REPLACE FUNCTION bills_keep_payments_inside_span()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  start_index integer := jalali_month_index(NEW.start_on);
  end_index integer := jalali_month_index(NEW.end_on);
BEGIN
  IF EXISTS (
    SELECT 1
    FROM installment_payments AS p
    WHERE p.bill_id = NEW.id
      AND (
        jalali_month_index(p.due_on) < start_index
        OR jalali_month_index(p.due_on) > end_index
      )
  ) THEN
    RAISE EXCEPTION 'bill span no longer covers recorded payments';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bills_keep_payments_inside_span ON bills;
CREATE TRIGGER bills_keep_payments_inside_span
  BEFORE UPDATE OF start_on, end_on ON bills
  FOR EACH ROW EXECUTE FUNCTION bills_keep_payments_inside_span();
