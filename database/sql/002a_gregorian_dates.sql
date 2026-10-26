-- Convert stored Jalali year/month/day integers to Gregorian DATE columns.
-- Also installs date_to_jalali helpers (001_calendar is already applied).
-- Idempotent: table ALTERs no-op when bills.start_on already exists.

CREATE OR REPLACE FUNCTION date_to_jalali(d date)
RETURNS TABLE (jy integer, jm integer, jd integer)
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  jdn bigint;
  gy integer;
  jy_v integer;
  cal record;
  jdn1f bigint;
  k integer;
BEGIN
  jdn := gregorian_to_jdn(
    EXTRACT(YEAR FROM d)::integer,
    EXTRACT(MONTH FROM d)::integer,
    EXTRACT(DAY FROM d)::integer
  );
  gy := EXTRACT(YEAR FROM jdn_to_gregorian(jdn))::integer;
  jy_v := gy - 621;
  IF jy_v > 3177 THEN
    jy_v := 3177;
  END IF;
  SELECT * INTO cal FROM jal_cal(jy_v);
  jdn1f := gregorian_to_jdn(cal.gy, 3, cal.march);
  k := (jdn - jdn1f)::integer;
  IF k >= 0 THEN
    IF k <= 185 THEN
      jy := jy_v;
      jm := 1 + jal_div(k, 31)::integer;
      jd := jal_mod(k, 31)::integer + 1;
      RETURN NEXT;
      RETURN;
    END IF;
    k := k - 186;
  ELSE
    jy_v := jy_v - 1;
    k := k + 179;
    IF cal.leap = 1 THEN
      k := k + 1;
    END IF;
  END IF;
  jy := jy_v;
  jm := 7 + jal_div(k, 30)::integer;
  jd := jal_mod(k, 30)::integer + 1;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION jalali_year(d date)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT jy FROM date_to_jalali(d);
$$;

CREATE OR REPLACE FUNCTION jalali_month(d date)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT jm FROM date_to_jalali(d);
$$;

CREATE OR REPLACE FUNCTION jalali_day(d date)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT jd FROM date_to_jalali(d);
$$;

CREATE OR REPLACE FUNCTION jalali_month_index(d date)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT jy * 12 + (jm - 1) FROM date_to_jalali(d);
$$;

DROP VIEW IF EXISTS v_ledger_entries;
DROP VIEW IF EXISTS v_month_totals;
DROP VIEW IF EXISTS v_installments;

DROP TRIGGER IF EXISTS installment_payments_inside_bill ON installment_payments;
DROP TRIGGER IF EXISTS bills_keep_payments_inside_span ON bills;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bills'
      AND column_name = 'start_year'
  ) THEN
    ALTER TABLE bills
      ADD COLUMN IF NOT EXISTS start_on date,
      ADD COLUMN IF NOT EXISTS end_on date;

    UPDATE bills
       SET start_on = jalali_to_date(start_year, start_month, due_day),
           end_on = jalali_to_date(
             ((start_year * 12 + (start_month - 1) + duration_months - 1) / 12)::integer,
             (((start_year * 12 + (start_month - 1) + duration_months - 1) % 12) + 1)::integer,
             jalali_clamp_day(
               ((start_year * 12 + (start_month - 1) + duration_months - 1) / 12)::integer,
               (((start_year * 12 + (start_month - 1) + duration_months - 1) % 12) + 1)::integer,
               due_day
             )
           )
     WHERE start_on IS NULL OR end_on IS NULL;

    ALTER TABLE bills
      ALTER COLUMN start_on SET NOT NULL,
      ALTER COLUMN end_on SET NOT NULL;

    ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_due_day_in_start_month;
    ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_end_on_after_start;
    ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_duration_months;

    ALTER TABLE bills
      ADD CONSTRAINT bills_end_on_after_start CHECK (end_on >= start_on),
      ADD CONSTRAINT bills_duration_months CHECK (
        jalali_month_index(end_on) - jalali_month_index(start_on) BETWEEN 0 AND 59
      ),
      ADD CONSTRAINT bills_due_day_in_start_month CHECK (
        due_day <= jalali_month_length(jalali_year(start_on), jalali_month(start_on))
      );

    DROP INDEX IF EXISTS bills_user_start_idx;
    CREATE INDEX IF NOT EXISTS bills_user_start_idx ON bills (user_id, start_on);

    ALTER TABLE bills
      DROP COLUMN IF EXISTS start_year,
      DROP COLUMN IF EXISTS start_month,
      DROP COLUMN IF EXISTS duration_months;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'installment_payments'
      AND column_name = 'jalali_year'
  ) THEN
    ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS due_on date;

    UPDATE installment_payments AS p
       SET due_on = jalali_to_date(
         p.jalali_year,
         p.jalali_month,
         jalali_clamp_day(p.jalali_year, p.jalali_month, b.due_day)
       )
      FROM bills AS b
     WHERE b.id = p.bill_id
       AND p.due_on IS NULL;

    ALTER TABLE installment_payments ALTER COLUMN due_on SET NOT NULL;
    ALTER TABLE installment_payments DROP CONSTRAINT IF EXISTS installment_payments_pkey;
    ALTER TABLE installment_payments
      ADD PRIMARY KEY (bill_id, due_on);
    ALTER TABLE installment_payments
      DROP COLUMN IF EXISTS jalali_year,
      DROP COLUMN IF EXISTS jalali_month;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bank_deposits'
      AND column_name = 'jalali_year'
  ) THEN
    ALTER TABLE bank_deposits
      ADD COLUMN IF NOT EXISTS arrived_on date,
      ADD COLUMN IF NOT EXISTS booked_on date;

    UPDATE bank_deposits
       SET arrived_on = jalali_to_date(jalali_year, jalali_month, jalali_day),
           booked_on = jalali_to_date(booked_year, booked_month, 1)
     WHERE arrived_on IS NULL OR booked_on IS NULL;

    ALTER TABLE bank_deposits
      ALTER COLUMN arrived_on SET NOT NULL,
      ALTER COLUMN booked_on SET NOT NULL;

    ALTER TABLE bank_deposits DROP CONSTRAINT IF EXISTS bank_deposits_real_day;
    DROP INDEX IF EXISTS bank_deposits_booked_idx;
    CREATE INDEX IF NOT EXISTS bank_deposits_booked_idx
      ON bank_deposits (user_id, booked_on);

    ALTER TABLE bank_deposits
      DROP COLUMN IF EXISTS jalali_year,
      DROP COLUMN IF EXISTS jalali_month,
      DROP COLUMN IF EXISTS jalali_day,
      DROP COLUMN IF EXISTS booked_year,
      DROP COLUMN IF EXISTS booked_month;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'expenses'
      AND column_name = 'jalali_year'
  ) THEN
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS occurred_on date;

    UPDATE expenses
       SET occurred_on = jalali_to_date(jalali_year, jalali_month, jalali_day)
     WHERE occurred_on IS NULL;

    ALTER TABLE expenses ALTER COLUMN occurred_on SET NOT NULL;
    ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_real_day;
    DROP INDEX IF EXISTS expenses_month_idx;
    CREATE INDEX IF NOT EXISTS expenses_month_idx
      ON expenses (user_id, occurred_on);

    ALTER TABLE expenses
      DROP COLUMN IF EXISTS jalali_year,
      DROP COLUMN IF EXISTS jalali_month,
      DROP COLUMN IF EXISTS jalali_day;
  END IF;
END;
$$;

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

-- Recreate views here so existing databases (where 003/004 already ran) get them.
CREATE OR REPLACE VIEW v_installments AS
SELECT
  b.user_id,
  b.id::text || '__' || to_char(m.due_date, 'YYYY-MM-DD') AS id,
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
      ((jalali_month_index(b.start_on) + gs.month_offset) / 12)::smallint AS due_year,
      (((jalali_month_index(b.start_on) + gs.month_offset) % 12) + 1)::smallint AS due_month,
      jalali_clamp_day(
        ((jalali_month_index(b.start_on) + gs.month_offset) / 12)::integer,
        (((jalali_month_index(b.start_on) + gs.month_offset) % 12) + 1)::integer,
        b.due_day
      ) AS due_day
    FROM generate_series(
      0,
      jalali_month_index(b.end_on) - jalali_month_index(b.start_on)
    ) AS gs(month_offset)
  ) AS due
) AS m
LEFT JOIN installment_payments AS p
  ON p.bill_id = b.id
 AND p.due_on = m.due_date
LEFT JOIN bill_logos AS l
  ON l.bill_id = b.id;

CREATE OR REPLACE VIEW v_month_totals AS
WITH lines AS (
  SELECT
    user_id,
    jalali_year(booked_on) AS jalali_year,
    jalali_month(booked_on) AS jalali_month,
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
    jalali_year(occurred_on),
    jalali_month(occurred_on),
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
      WHEN jalali_year(d.arrived_on) = jalali_year(d.booked_on)
       AND jalali_month(d.arrived_on) = jalali_month(d.booked_on) THEN NULL
      ELSE 'Arrived ' || jalali_month_name(jalali_month(d.arrived_on))
        || ' ' || jalali_year(d.arrived_on)::text
    END AS detail,
    d.amount,
    jalali_year(d.booked_on) AS counted_year,
    jalali_month(d.booked_on) AS counted_month,
    jalali_year(d.arrived_on) AS year,
    jalali_month(d.arrived_on) AS month,
    jalali_day(d.arrived_on) AS day,
    d.arrived_on AS occurred_on,
    NULL::text AS status,
    NULL::text AS installment_id,
    NULL::uuid AS expense_id,
    NULL::expense_category AS category,
    (jalali_year(d.arrived_on) * 10000
      + jalali_month(d.arrived_on) * 100
      + jalali_day(d.arrived_on)) * 3 AS sort_key,
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
    i.due_date,
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
    jalali_year(e.occurred_on),
    jalali_month(e.occurred_on),
    jalali_year(e.occurred_on),
    jalali_month(e.occurred_on),
    jalali_day(e.occurred_on),
    e.occurred_on,
    NULL,
    NULL,
    e.id,
    e.category,
    (jalali_year(e.occurred_on) * 10000
      + jalali_month(e.occurred_on) * 100
      + jalali_day(e.occurred_on)) * 3 + 2,
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
  occurred_on,
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
