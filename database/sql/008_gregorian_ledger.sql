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

INSERT INTO schema_migrations (version)
VALUES ('008_gregorian_ledger')
ON CONFLICT (version) DO NOTHING;
