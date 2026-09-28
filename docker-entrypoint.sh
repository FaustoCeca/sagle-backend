#!/bin/sh
set -e

# Las variables (DATABASE_URL, CORS_ORIGIN, claves, etc.) llegan al contenedor
# vía `env_file: .env.prod` en docker-compose, así que ya están en el entorno
# tanto para `prisma migrate deploy` como para la app.

echo "[entrypoint] prisma migrate deploy..."
npx prisma migrate deploy

echo "[entrypoint] starting NestJS (node dist/main)..."
exec node dist/main
