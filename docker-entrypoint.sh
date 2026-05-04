#!/bin/sh
set -e
if [ "${RUN_MIGRATIONS_ON_START:-false}" = "true" ]; then
  prisma migrate deploy
elif [ "${RUN_DB_PUSH_ON_START:-false}" = "true" ]; then
  # --skip-generate : le client est déjà généré au build ; sinon écriture impossible en user nextjs dans /pnpm/global.
  prisma db push --skip-generate
fi
exec node server.js
