# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

# ---------- зависимости (postinstall генерирует Prisma Client) ----------
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------- миграции: одноразовый контейнер с Prisma CLI ----------
FROM deps AS migrator
USER node
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

# ---------- сборка ----------
FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
# --omit=optional убирает Prisma CLI и TypeScript: npm помечает их как
# optional peer-зависимости @prisma/client, и --omit=dev их не удаляет.
RUN npm run build \
 && npm prune --omit=dev --omit=optional --ignore-scripts

# ---------- рантайм: только dist и prod-зависимости ----------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=4000 \
    UPLOAD_DIR=/app/uploads

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

RUN mkdir -p uploads && chown node:node uploads
USER node

EXPOSE 4000
VOLUME ["/app/uploads"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

CMD ["node", "dist/main.js"]
