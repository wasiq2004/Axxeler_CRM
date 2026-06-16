#!/bin/sh
set -e

echo "[entrypoint] Waiting for database..."
until node_modules/.bin/prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; do
  sleep 2
done

echo "[entrypoint] Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] Starting Axxeler CRM API..."
exec node server/dist/index.js
