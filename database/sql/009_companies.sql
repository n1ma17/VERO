-- Per-user bill companies (name + optional logo). Bills optionally link to one.
-- Null company_id means "Others". Replaces per-bill logos for new writes;
-- existing bill_logos are migrated into companies once.

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS companies_user_name_idx
  ON companies (user_id, lower(btrim(name)));

COMMENT ON TABLE companies IS
  'Bill payees / institutions. Optional logo; bills.company_id null = Others.';

CREATE TABLE IF NOT EXISTS company_logos (
  company_id uuid PRIMARY KEY REFERENCES companies (id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN (
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  )),
  bytes bytea NOT NULL CHECK (octet_length(bytes) BETWEEN 1 AND 131072),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE company_logos IS
  'Optional company logo, max 128 KB (JPEG/PNG/WebP/GIF).';

DROP TRIGGER IF EXISTS companies_set_updated_at ON companies;
CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS company_logos_set_updated_at ON company_logos;
CREATE TRIGGER company_logos_set_updated_at
  BEFORE UPDATE ON company_logos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bills_user_company_idx
  ON bills (user_id, company_id);

-- One-time: bill with a logo → company named after the bill, logo moved, FK set.
DO $$
DECLARE
  r record;
  new_id uuid;
BEGIN
  FOR r IN
    SELECT b.id AS bill_id, b.user_id, b.title, l.media_type, l.bytes
      FROM bills AS b
      JOIN bill_logos AS l ON l.bill_id = b.id
     WHERE b.company_id IS NULL
  LOOP
    new_id := gen_random_uuid();
    INSERT INTO companies (id, user_id, name)
    VALUES (new_id, r.user_id, left(btrim(r.title), 80));

    INSERT INTO company_logos (company_id, media_type, bytes)
    VALUES (
      new_id,
      CASE
        WHEN r.media_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')
          THEN r.media_type
        ELSE 'image/png'
      END,
      r.bytes
    );

    UPDATE bills SET company_id = new_id WHERE id = r.bill_id;
  END LOOP;
END;
$$;

-- Installments show the company logo (key = company id) instead of bill logo.
DROP VIEW IF EXISTS v_ledger_entries_g;
DROP VIEW IF EXISTS v_month_totals_g;
DROP VIEW IF EXISTS v_ledger_entries;
DROP VIEW IF EXISTS v_month_totals;
DROP VIEW IF EXISTS v_installments;

CREATE OR REPLACE VIEW v_installments AS
SELECT
  b.user_id,
  b.id::text || '__' || to_char(m.due_date, 'YYYY-MM-DD') AS id,
  b.id AS bill_id,
  b.title,
  b.amount,
  b.currency,
  b.amount / fx.per_usd AS amount_usd,
  b.company_id,
  c.name AS company_name,
  m.due_year,
  m.due_month,
  m.due_day,
  m.due_date,
  p.paid_at,
  CASE WHEN cl.company_id IS NULL THEN NULL ELSE c.id::text END AS logo_key,
  CASE
    WHEN p.paid_at IS NOT NULL THEN 'paid'
    WHEN m.due_date < (timezone('Asia/Tehran', now()))::date THEN 'overdue'
    ELSE 'unpaid'
  END AS status
FROM bills AS b
JOIN v_user_fx AS fx
  ON fx.user_id = b.user_id
 AND fx.currency = b.currency
LEFT JOIN companies AS c
  ON c.id = b.company_id
LEFT JOIN company_logos AS cl
  ON cl.company_id = c.id
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
 AND p.due_on = m.due_date;

-- Recreate dependents from 007 (bodies unchanged; dropped only for v_installments).
CREATE OR REPLACE VIEW v_month_totals AS
WITH lines AS (
  SELECT
    d.user_id,
    jalali_year(d.booked_on) AS jalali_year,
    jalali_month(d.booked_on) AS jalali_month,
    d.amount / fx.per_usd AS income,
    0::numeric AS bills,
    0::numeric AS expenses
  FROM bank_deposits AS d
  JOIN v_user_fx AS fx
    ON fx.user_id = d.user_id
   AND fx.currency = d.currency
  UNION ALL
  SELECT
    user_id,
    jalali_year((timezone('Asia/Tehran', paid_at))::date),
    jalali_month((timezone('Asia/Tehran', paid_at))::date),
    0::numeric,
    amount_usd,
    0::numeric
  FROM v_installments
  WHERE paid_at IS NOT NULL
  UNION ALL
  SELECT
    e.user_id,
    jalali_year(e.occurred_on),
    jalali_month(e.occurred_on),
    0::numeric,
    0::numeric,
    e.amount / fx.per_usd
  FROM expenses AS e
  JOIN v_user_fx AS fx
    ON fx.user_id = e.user_id
   AND fx.currency = e.currency
),
grouped AS (
  SELECT
    user_id,
    jalali_year,
    jalali_month,
    jalali_year * 12 + (jalali_month - 1) AS month_index,
    sum(income) AS income,
    sum(bills) AS bills,
    sum(expenses) AS expenses
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
  ) AS closing_balance
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
    d.currency,
    d.amount / fx.per_usd AS amount_usd,
    jalali_year(d.booked_on) AS counted_year,
    jalali_month(d.booked_on) AS counted_month,
    jalali_year(d.arrived_on) AS year,
    jalali_month(d.arrived_on) AS month,
    jalali_day(d.arrived_on) AS day,
    d.arrived_on AS occurred_on,
    NULL::text AS status,
    NULL::text AS installment_id,
    NULL::uuid AS expense_id,
    NULL::text AS category,
    (jalali_year(d.arrived_on) * 10000
      + jalali_month(d.arrived_on) * 100
      + jalali_day(d.arrived_on)) * 3 AS sort_key,
    d.id AS source_id
  FROM bank_deposits AS d
  JOIN v_user_fx AS fx
    ON fx.user_id = d.user_id
   AND fx.currency = d.currency
  UNION ALL
  SELECT
    i.user_id,
    'bill-' || i.id,
    'bill',
    i.title,
    CASE
      WHEN jalali_year(pay.paid_on) = i.due_year
       AND jalali_month(pay.paid_on) = i.due_month THEN NULL
      ELSE 'Due ' || jalali_month_name(i.due_month) || ' ' || i.due_year::text
    END,
    i.amount,
    i.currency,
    i.amount_usd,
    jalali_year(pay.paid_on) AS counted_year,
    jalali_month(pay.paid_on) AS counted_month,
    jalali_year(pay.paid_on) AS year,
    jalali_month(pay.paid_on) AS month,
    jalali_day(pay.paid_on) AS day,
    pay.paid_on AS occurred_on,
    i.status,
    i.id,
    NULL::uuid,
    NULL::text,
    (jalali_year(pay.paid_on) * 10000
      + jalali_month(pay.paid_on) * 100
      + jalali_day(pay.paid_on)) * 3 + 1,
    i.bill_id
  FROM v_installments AS i
  CROSS JOIN LATERAL (
    SELECT (timezone('Asia/Tehran', i.paid_at))::date AS paid_on
  ) AS pay
  WHERE i.paid_at IS NOT NULL
  UNION ALL
  SELECT
    e.user_id,
    'expense-' || e.id::text,
    'expense',
    e.title,
    e.note,
    e.amount,
    e.currency,
    e.amount / fx.per_usd,
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
  JOIN v_user_fx AS fx
    ON fx.user_id = e.user_id
   AND fx.currency = e.currency
)
SELECT
  user_id,
  id,
  kind,
  title,
  detail,
  amount,
  currency,
  amount_usd,
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
  sum(CASE WHEN kind = 'deposit' THEN amount_usd ELSE -amount_usd END) OVER (
    PARTITION BY user_id
    ORDER BY counted_year, counted_month, sort_key, source_id
    ROWS UNBOUNDED PRECEDING
  ) AS balance_usd
FROM lines;
-- Gregorian-month ledger views for non-IRR display currencies.
-- Jalali views (v_month_totals / v_ledger_entries) stay the IRR path.

CREATE OR REPLACE VIEW v_month_totals_g AS
WITH lines AS (
  SELECT
    d.user_id,
    EXTRACT(YEAR FROM d.booked_on)::integer AS cal_year,
    EXTRACT(MONTH FROM d.booked_on)::integer AS cal_month,
    d.amount / fx.per_usd AS income,
    0::numeric AS bills,
    0::numeric AS expenses
  FROM bank_deposits AS d
  JOIN v_user_fx AS fx
    ON fx.user_id = d.user_id
   AND fx.currency = d.currency
  UNION ALL
  SELECT
    user_id,
    EXTRACT(YEAR FROM (timezone('Asia/Tehran', paid_at))::date)::integer,
    EXTRACT(MONTH FROM (timezone('Asia/Tehran', paid_at))::date)::integer,
    0::numeric,
    amount_usd,
    0::numeric
  FROM v_installments
  WHERE paid_at IS NOT NULL
  UNION ALL
  SELECT
    e.user_id,
    EXTRACT(YEAR FROM e.occurred_on)::integer,
    EXTRACT(MONTH FROM e.occurred_on)::integer,
    0::numeric,
    0::numeric,
    e.amount / fx.per_usd
  FROM expenses AS e
  JOIN v_user_fx AS fx
    ON fx.user_id = e.user_id
   AND fx.currency = e.currency
),
grouped AS (
  SELECT
    user_id,
    cal_year,
    cal_month,
    cal_year * 12 + (cal_month - 1) AS month_index,
    sum(income) AS income,
    sum(bills) AS bills,
    sum(expenses) AS expenses
  FROM lines
  GROUP BY user_id, cal_year, cal_month
)
SELECT
  user_id,
  cal_year AS jalali_year,
  cal_month AS jalali_month,
  to_char(make_date(cal_year, cal_month, 1), 'Mon') AS month_name,
  month_index,
  income,
  bills,
  expenses,
  (income - bills - expenses) AS net,
  sum(income - bills - expenses) OVER (
    PARTITION BY user_id
    ORDER BY month_index
    ROWS UNBOUNDED PRECEDING
  ) AS closing_balance
FROM grouped;

CREATE OR REPLACE VIEW v_ledger_entries_g AS
WITH lines AS (
  SELECT
    d.user_id,
    'deposit-' || d.id::text AS id,
    'deposit'::text AS kind,
    COALESCE(d.note, 'Bank deposit') AS title,
    CASE
      WHEN date_trunc('month', d.arrived_on) = date_trunc('month', d.booked_on) THEN NULL
      ELSE 'Arrived ' || to_char(d.arrived_on, 'Mon YYYY')
    END AS detail,
    d.amount,
    d.currency,
    d.amount / fx.per_usd AS amount_usd,
    EXTRACT(YEAR FROM d.booked_on)::integer AS counted_year,
    EXTRACT(MONTH FROM d.booked_on)::integer AS counted_month,
    EXTRACT(YEAR FROM d.arrived_on)::integer AS year,
    EXTRACT(MONTH FROM d.arrived_on)::integer AS month,
    EXTRACT(DAY FROM d.arrived_on)::integer AS day,
    d.arrived_on AS occurred_on,
    NULL::text AS status,
    NULL::text AS installment_id,
    NULL::uuid AS expense_id,
    NULL::text AS category,
    (EXTRACT(YEAR FROM d.arrived_on)::integer * 10000
      + EXTRACT(MONTH FROM d.arrived_on)::integer * 100
      + EXTRACT(DAY FROM d.arrived_on)::integer) * 3 AS sort_key,
    d.id AS source_id
  FROM bank_deposits AS d
  JOIN v_user_fx AS fx
    ON fx.user_id = d.user_id
   AND fx.currency = d.currency
  UNION ALL
  SELECT
    i.user_id,
    'bill-' || i.id,
    'bill',
    i.title,
    CASE
      WHEN date_trunc('month', pay.paid_on) = date_trunc('month', i.due_date) THEN NULL
      ELSE 'Due ' || to_char(i.due_date, 'Mon YYYY')
    END,
    i.amount,
    i.currency,
    i.amount_usd,
    EXTRACT(YEAR FROM pay.paid_on)::integer AS counted_year,
    EXTRACT(MONTH FROM pay.paid_on)::integer AS counted_month,
    EXTRACT(YEAR FROM pay.paid_on)::integer AS year,
    EXTRACT(MONTH FROM pay.paid_on)::integer AS month,
    EXTRACT(DAY FROM pay.paid_on)::integer AS day,
    pay.paid_on AS occurred_on,
    i.status,
    i.id,
    NULL::uuid,
    NULL::text,
    (EXTRACT(YEAR FROM pay.paid_on)::integer * 10000
      + EXTRACT(MONTH FROM pay.paid_on)::integer * 100
      + EXTRACT(DAY FROM pay.paid_on)::integer) * 3 + 1,
    i.bill_id
  FROM v_installments AS i
  CROSS JOIN LATERAL (
    SELECT (timezone('Asia/Tehran', i.paid_at))::date AS paid_on
  ) AS pay
  WHERE i.paid_at IS NOT NULL
  UNION ALL
  SELECT
    e.user_id,
    'expense-' || e.id::text,
    'expense',
    e.title,
    e.note,
    e.amount,
    e.currency,
    e.amount / fx.per_usd,
    EXTRACT(YEAR FROM e.occurred_on)::integer,
    EXTRACT(MONTH FROM e.occurred_on)::integer,
    EXTRACT(YEAR FROM e.occurred_on)::integer,
    EXTRACT(MONTH FROM e.occurred_on)::integer,
    EXTRACT(DAY FROM e.occurred_on)::integer,
    e.occurred_on,
    NULL,
    NULL,
    e.id,
    e.category,
    (EXTRACT(YEAR FROM e.occurred_on)::integer * 10000
      + EXTRACT(MONTH FROM e.occurred_on)::integer * 100
      + EXTRACT(DAY FROM e.occurred_on)::integer) * 3 + 2,
    e.id
  FROM expenses AS e
  JOIN v_user_fx AS fx
    ON fx.user_id = e.user_id
   AND fx.currency = e.currency
)
SELECT
  user_id,
  id,
  kind,
  title,
  detail,
  amount,
  currency,
  amount_usd,
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
  sum(CASE WHEN kind = 'deposit' THEN amount_usd ELSE -amount_usd END) OVER (
    PARTITION BY user_id
    ORDER BY counted_year, counted_month, sort_key, source_id
    ROWS UNBOUNDED PRECEDING
  ) AS balance_usd
FROM lines;
