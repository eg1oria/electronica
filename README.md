# Electronica

Интернет-магазин электроники: витрина на Next.js и API на NestJS с админкой.

| Каталог | Что внутри | Документация |
| --- | --- | --- |
| [`frontend/`](frontend) | витрина и админка, Next.js 16 · React 19 · Tailwind 4 | [frontend/README.md](frontend/README.md) |
| [`backend/`](backend) | API, NestJS 12 · Prisma 7 · PostgreSQL 17 | [backend/README.md](backend/README.md) |
| [`deploy/`](deploy) | конфигурация nginx и скрипт резервных копий | [DEPLOY.md](DEPLOY.md) |

## Локальная разработка

```bash
cd backend  && npm install && cp .env.example .env && npm run db:up && npm run prisma:deploy && npm run db:seed && npm run start:dev
cd frontend && npm install && cp .env.example .env.local && npm run dev
```

Витрина — http://localhost:3000, API — http://localhost:4000/api,
админка — http://localhost:3000/admin.

## Продакшн

Весь стек (база, миграции, API, витрина, nginx) поднимается из корня:

```bash
cp .env.example .env     # секреты и домен
docker compose up -d --build
docker compose exec api node dist/seed.js
```

Подробно — в [DEPLOY.md](DEPLOY.md): HTTPS, обновления, резервные копии,
диагностика.
