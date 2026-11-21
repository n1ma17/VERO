-- User-defined expense category slugs (app stores catalog in localStorage; DB stores slug as text).

DROP VIEW IF EXISTS v_ledger_entries;

ALTER TABLE expenses
  ALTER COLUMN category TYPE text USING category::text;

ALTER TABLE expenses
  ALTER COLUMN category SET NOT NULL;

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
    NULL::text AS category,
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

DROP TYPE IF EXISTS expense_category;

INSERT INTO schema_migrations (version)
VALUES ('006_expense_category_text')
ON CONFLICT (version) DO NOTHING;