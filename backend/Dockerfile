# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

# ---------- зависимости (postinstall генерирует Prisma Client) ----------
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------- сборка ----------
FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build \
 && npm prune --omit=dev --ignore-scripts

# ---------- рантайм ----------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=4000 \
    UPLOAD_DIR=/app/uploads

COPY --from=build --chown=node:node /app/package.json /app/prisma.config.ts ./
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node docker-entrypoint.sh ./

RUN mkdir -p uploads && chown node:node uploads && chmod +x docker-entrypoint.sh
USER node

EXPOSE 4000
VOLUME ["/app/uploads"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
