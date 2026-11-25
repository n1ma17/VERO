#!/bin/sh
set -e

echo "Applying database migrations..."
npx tsx scripts/migrate.ts

echo "Starting Nest API on :${PORT:-3000}..."
exec node dist/main.js
