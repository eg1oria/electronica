#!/bin/sh
set -e

# Миграции применяются при каждом старте; отключить: RUN_MIGRATIONS=false
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Применяю миграции..."
  ./node_modules/.bin/prisma migrate deploy
fi

exec "$@"
