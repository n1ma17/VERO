-- Derived reads. These match the Vue ledger:
--   deposits count in the booked month
--   bill installments count only when paid, in the Jalali month of payment (Asia/Tehran)
--   expenses count in the purchase month
--   balance = cumulative deposits - paid bills - expenses, and may be negative
-- Dates are stored Gregorian; grouping is by the Jalali month of that date.
-- Overdue uses the calendar date in Asia/Tehran.

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

COMMENT ON VIEW v_installments IS
  'One row per bill month. Id is billId__YYYY-MM-DD (Gregorian due date).';

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
    jalali_year((timezone('Asia/Tehran', paid_at))::date),
    jalali_month((timezone('Asia/Tehran', paid_at))::date),
    0::bigint,
    amount,
    0::bigint
  FROM v_installments
  WHERE paid_at IS NOT NULL
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

COMMENT ON VIEW v_month_totals IS
  'Sparse Jalali months that have activity. closing_balance matches balanceThrough. Bills count only when paid (payment month in Asia/Tehran).';

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
    CASE
      WHEN jalali_year(pay.paid_on) = i.due_year
       AND jalali_month(pay.paid_on) = i.due_month THEN NULL
      ELSE 'Due ' || jalali_month_name(i.due_month) || ' ' || i.due_year::text
    END,
    i.amount,
    jalali_year(pay.paid_on) AS counted_year,
    jalali_month(pay.paid_on) AS counted_month,
    jalali_year(pay.paid_on) AS year,
    jalali_month(pay.paid_on) AS month,
    jalali_day(pay.paid_on) AS day,
    pay.paid_on AS occurred_on,
    i.status,
    i.id,
    NULL::uuid,
    NULL::expense_category,
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

COMMENT ON VIEW v_ledger_entries IS
  'Transactions statement. Deposits add; paid bills and expenses subtract. Unpaid installments are omitted.';

INSERT INTO schema_migrations (version)
VALUES ('001_calendar'), ('002_tables'), ('003_views')
ON CONFLICT (version) DO NOTHING;
