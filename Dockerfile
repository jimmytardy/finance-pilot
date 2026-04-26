# syntax=docker/dockerfile:1

ARG NODE_VERSION=22
ARG PRISMA_VERSION=6.19.3

FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
  PNPM_HOME="/pnpm" \
  PATH="/pnpm:$PATH"
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ---------------------------------------------------------------------------
# deps — uniquement manifests + prisma : le cache Docker reste valide tant que
# package.json / pnpm-lock.yaml / prisma/* ne changent pas (indépendant du reste du code).
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store \
  && pnpm fetch --frozen-lockfile

COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store \
  && pnpm install --frozen-lockfile --offline

# ---------------------------------------------------------------------------
# builder — code applicatif : seule cette étape est rejouée quand vous modifiez l’app.
# ---------------------------------------------------------------------------
FROM deps AS builder
COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_MATOMO_URL
ARG NEXT_PUBLIC_MATOMO_SITE_ID
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
  NEXT_PUBLIC_MATOMO_URL=$NEXT_PUBLIC_MATOMO_URL \
  NEXT_PUBLIC_MATOMO_SITE_ID=$NEXT_PUBLIC_MATOMO_SITE_ID \
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

RUN pnpm prisma generate && pnpm build

# ---------------------------------------------------------------------------
# runner — aucun port ni EXPOSE : le mapping et PORT sont gérés au déploiement.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
  HOSTNAME=0.0.0.0 \
  PNPM_HOME="/pnpm" \
  PATH="/pnpm:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ARG PRISMA_VERSION
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
  && pnpm config set global-bin-dir /usr/local/bin \
  && pnpm add --global prisma@${PRISMA_VERSION}

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

COPY --chown=root:root docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 0755 /usr/local/bin/docker-entrypoint.sh

USER nextjs

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
