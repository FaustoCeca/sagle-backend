# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder: instala TODAS las deps, genera el cliente Prisma,
# compila la app (nest build → dist/) y compila el seed (→ dist-seed/).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Prisma necesita openssl para resolver/usar el engine correcto.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Compila el seed por separado (tsc sigue el import de seed-data.ts).
# El manifest seed-images.json se lee en runtime vía fs, no se importa.
RUN npx tsc prisma/seed.ts \
  --outDir dist-seed \
  --module commonjs \
  --esModuleInterop \
  --skipLibCheck \
  --target ES2021

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — runner: imagen final, mínima. Solo deps de producción + artefactos.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copiamos el schema ANTES del install para que el postinstall de @prisma/client
# (que corre `prisma generate`) encuentre el schema y genere el cliente.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

# Artefactos compilados desde el builder.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-seed ./dist-seed

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

# El entrypoint corre las migraciones (idempotente) y luego arranca la app.
ENTRYPOINT ["./docker-entrypoint.sh"]
