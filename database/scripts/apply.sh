#!/usr/bin/env bash
# Create the local database app_money and apply sql/*.sql.
# Uses the PostgreSQL 18 instance already running on this machine
# (data directory F:\database). Does not start a second server.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PSQL="${PSQL:-/c/Program Files/PostgreSQL/18/bin/psql.exe}"

export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"

if [[ -z "${PGPASSWORD:-}" ]]; then
  echo "Set PGPASSWORD to the local postgres password (the one saved in pgAdmin)." >&2
  exit 1
fi

if [[ ! -x "$PSQL" && ! -f "$PSQL" ]]; then
  echo "psql not found at: $PSQL" >&2
  exit 1
fi

exists="$("$PSQL" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'app_money'")"
if [[ "$exists" != "1" ]]; then
  "$PSQL" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE app_money"
fi

"$PSQL" -d postgres -v ON_ERROR_STOP=1 -c \
  "COMMENT ON DATABASE app_money IS 'Money app ledger. Amounts are integer Iranian Toman.'"

for file in 001_calendar.sql 002_tables.sql 002a_gregorian_dates.sql 003_views.sql 004_better_auth.sql; do
  "$PSQL" -d app_money -v ON_ERROR_STOP=1 -f "$ROOT/sql/$file"
done

echo "app_money is ready on ${PGHOST}:${PGPORT}"
