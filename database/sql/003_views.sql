-- Derived reads. These match the Vue ledger:
--   deposits count in the booked month
--   bill installments count in the due month, paid or not
--   expenses count in the purchase month
--   balance = cumulative deposits - bills - expenses, and may be negative
-- Overdue uses the calendar date in Asia/Tehran, because the app compares
-- the due date with the user's local today.

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

COMMENT ON VIEW v_installments IS
  'One row per bill month, same id shape as encodeInstallmentId (billId__YYYY-MM).';

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

COMMENT ON VIEW v_month_totals IS
  'Sparse Jalali months that have activity. closing_balance matches balanceThrough. Bills count whether paid or not.';

-- Statement lines. `balance` is the running total in global order
-- (counted month, then date, deposits before bills before expenses).
-- That equals the within-month running balance the transactions page shows.
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

COMMENT ON VIEW v_ledger_entries IS
  'Transactions statement. Deposits add; bills and expenses subtract. Empty months are omitted.';

INSERT INTO schema_migrations (version)
VALUES ('001_calendar'), ('002_tables'), ('003_views')
ON CONFLICT (version) DO NOTHING;
