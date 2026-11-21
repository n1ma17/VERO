-- Multi-currency money rows.
-- Every bill, deposit and expense keeps the amount and currency it was entered in;
-- those values are never rewritten when the user changes display currency.
-- Views normalize each row to USD with the latest rates (fx_rates, overridden per
-- user by a manual IRR market rate) so mixed-currency sums stay consistent. The API
-- converts the USD figures to the user's display currency.
-- Existing amounts were Toman; they become IRR (x10).

DROP VIEW IF EXISTS v_ledger_entries;
DROP VIEW IF EXISTS v_month_totals;
DROP VIEW IF EXISTS v_installments;

DO $$
BEGIN
  CREATE DOMAIN money_amount AS numeric(20, 2)
    CHECK (VALUE > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE bills
  ALTER COLUMN amount TYPE money_amount USING (amount * 10)::numeric(20, 2);
ALTER TABLE bank_deposits
  ALTER COLUMN amount TYPE money_amount USING (amount * 10)::numeric(20, 2);
ALTER TABLE expenses
  ALTER COLUMN amount TYPE money_amount USING (amount * 10)::numeric(20, 2);

DROP DOMAIN IF EXISTS toman;

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IRR'
    CONSTRAINT bills_currency_check CHECK (currency IN ('USD', 'EUR', 'GBP', 'IRR'));
ALTER TABLE bank_deposits
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IRR'
    CONSTRAINT bank_deposits_currency_check CHECK (currency IN ('USD', 'EUR', 'GBP', 'IRR'));
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IRR'
    CONSTRAINT expenses_currency_check CHECK (currency IN ('USD', 'EUR', 'GBP', 'IRR'));

ALTER TABLE bills ALTER COLUMN currency DROP DEFAULT;
ALTER TABLE bank_deposits ALTER COLUMN currency DROP DEFAULT;
ALTER TABLE expenses ALTER COLUMN currency DROP DEFAULT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IRR'
    CONSTRAINT users_currency_check CHECK (currency IN ('USD', 'EUR', 'GBP', 'IRR')),
  ADD COLUMN IF NOT EXISTS irr_per_usd numeric(20, 4)
    CONSTRAINT users_irr_per_usd_check CHECK (irr_per_usd IS NULL OR irr_per_usd > 0);

COMMENT ON COLUMN users.currency IS
  'Display currency. Stored rows keep their own currency; this only changes conversion.';
COMMENT ON COLUMN users.irr_per_usd IS
  'Optional free-market IRR per USD. Overrides the official API rate for this user.';

CREATE TABLE IF NOT EXISTS fx_rates (
  currency text PRIMARY KEY CHECK (currency IN ('USD', 'EUR', 'GBP', 'IRR')),
  per_usd numeric(24, 8) NOT NULL CHECK (per_usd > 0),
  source text NOT NULL,
  fetched_at timestamptz NOT NULL
);

COMMENT ON TABLE fx_rates IS
  'Latest units of each currency per 1 USD. Refreshed by the API from open.er-api.com.';

-- Seed rows are stamped at the epoch so the API refreshes them on first use.
INSERT INTO fx_rates (currency, per_usd, source, fetched_at) VALUES
  ('USD', 1, 'fixed', now()),
  ('EUR', 0.92, 'seed', 'epoch'),
  ('GBP', 0.79, 'seed', 'epoch'),
  ('IRR', 42000, 'seed', 'epoch')
ON CONFLICT (currency) DO NOTHING;

CREATE OR REPLACE VIEW v_user_fx AS
SELECT
  u.id AS user_id,
  r.currency,
  CASE
    WHEN r.currency = 'IRR' AND u.irr_per_usd IS NOT NULL THEN u.irr_per_usd
    ELSE r.per_usd
  END AS per_usd
FROM users AS u
CROSS JOIN fx_rates AS r;

CREATE OR REPLACE VIEW v_installments AS
SELECT
  b.user_id,
  b.id::text || '__' || to_char(m.due_date, 'YYYY-MM-DD') AS id,
  b.id AS bill_id,
  b.title,
  b.amount,
  b.currency,
  b.amount / fx.per_usd AS amount_usd,
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
JOIN v_user_fx AS fx
  ON fx.user_id = b.user_id
 AND fx.currency = b.currency
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

-- All money columns below are USD (numeric). The API converts to display currency.
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

INSERT INTO schema_migrations (version)
VALUES ('007_multi_currency')
ON CONFLICT (version) DO NOTHING;
