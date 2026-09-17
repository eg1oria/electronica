# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

# ---------- зависимости ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------- сборка ----------
FROM deps AS build
# NEXT_PUBLIC_* попадают в браузерный код на этапе сборки, а не запуска.
# По умолчанию «/api» — тот же домен, что и сайт (за nginx): образ не
# привязан к доменному имени. Отдельный домен API — передайте абсолютный URL.
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

COPY next.config.ts tsconfig.json postcss.config.mjs ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---------- рантайм: только standalone-сборка ----------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# server.js + минимальный набор node_modules; public и static — рядом с ним.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" > /dev/null || exit 1

CMD ["node", "server.js"]
