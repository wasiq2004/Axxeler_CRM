#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] Seeding database (admin user + defaults)..."
node_modules/.bin/tsx prisma/seed.ts

echo "[entrypoint] Starting Axxeler CRM API..."
exec node server/dist/index.js
