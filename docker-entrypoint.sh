#!/bin/sh
set -e
if [ "${RUN_MIGRATIONS_ON_START:-false}" = "true" ]; then
  prisma migrate deploy
fi
exec node server.js
