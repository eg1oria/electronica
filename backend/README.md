# Electronica — бэкенд

API магазина электроники: каталог товаров, категории, бренды, характеристики, загрузка фото и защищённые эндпоинты для админки.

**Стек:** NestJS 12 · Prisma 7 · PostgreSQL 17 · JWT

## Запуск

```bash
npm install                 # заодно генерирует Prisma Client (postinstall)
cp .env.example .env        # при необходимости поменяйте JWT_SECRET и пароль админа
npm run db:up               # Postgres в Docker на localhost:5434
npm run prisma:deploy       # применить миграции
npm run db:seed             # админ из .env + демо-категории, бренды и товары
npm run start:dev           # http://localhost:4000/api
```

Админ по умолчанию: `admin` / `admin12345` (берётся из `ADMIN_LOGIN` / `ADMIN_PASSWORD`).

`JWT_SECRET` обязателен и должен быть не короче 32 символов — иначе приложение не запустится.

## Docker

```bash
cp .env.example .env               # задайте JWT_SECRET, ADMIN_PASSWORD, при желании POSTGRES_PASSWORD
docker compose up -d --build       # postgres → migrate (миграции) → api на http://localhost:4000/api
docker compose exec api node dist/seed.js   # создать админа и демо-данные
```

- `migrate` — одноразовый контейнер с Prisma CLI: применяет миграции и завершается, `api` стартует только после него. В рабочем образе Prisma CLI нет, поэтому он лёгкий.
- Фото хранятся в volume `uploads`, база — в volume `pgdata`.
- `api` работает от пользователя `node`, у контейнера есть `HEALTHCHECK` на `/api/health`.
- Postgres проброшен только на `127.0.0.1:5434`. Порт API меняется переменной `API_PORT`.
- Если API стоит за nginx, задайте `TRUST_PROXY=1`, чтобы лимиты запросов считались по реальному IP.

| Скрипт | Что делает |
| --- | --- |
| `npm run prisma:migrate` | создать миграцию после правки `prisma/schema.prisma` и перегенерировать клиент |
| `npm run prisma:studio` | GUI для просмотра БД |
| `npm run db:down` | остановить контейнер с БД |
| `npm test` / `npm run test:e2e` | unit / e2e-тесты (e2e требуют запущенную БД и сид) |

## Модель данных

- **Product** — `name`, `slug`, `sku` (артикул), `shortDescription`, `description`, `price`, `oldPrice` (для скидки), `stock`, `isActive` (опубликован), `isFeatured` (хит), `warrantyMonths`, `weightGrams`, `categoryId`, `brandId`
  - **images[]** — `url`, `alt`, `position` (первое фото — главное)
  - **specs[]** — `name`, `value`, `group`, `position` (например «Память → SSD → 512 ГБ»)
- **Category** — `name`, `slug`, `description`, `image`, `parentId` (подкатегории)
- **Brand** — `name`, `slug`, `logo`, `description`
- **User** — сотрудники админки, роли `ADMIN` и `MANAGER`

Цены в ответах — числа (`54990.5`). `slug`, если не передан, генерируется из названия (кириллица транслитерируется).

## API

Все пути начинаются с `/api`. Эндпоинты `admin/*` и `auth/me` требуют заголовок `Authorization: Bearer <token>`.

### Публичные

| Метод | Путь | Описание |
| --- | --- | --- |
| GET | `/products` | каталог (только опубликованные) |
| GET | `/products/:slug` | карточка товара с фото и характеристиками |
| GET | `/categories` | дерево категорий с количеством товаров |
| GET | `/categories/:slug` | категория с родителем и подкатегориями |
| GET | `/brands`, `/brands/:slug` | бренды |
| GET | `/uploads/:file` | загруженные изображения |
| GET | `/health` | проверка API и БД |

Параметры `GET /products`: `search`, `categorySlug` (включая подкатегории), `brandSlug`, `minPrice`, `maxPrice`, `inStock`, `isFeatured`, `sort` (`newest` · `price_asc` · `price_desc` · `name`), `page`, `limit` (≤ 100).
Ответ: `{ items, total, page, limit }`.

### Авторизация

| Метод | Путь | Описание |
| --- | --- | --- |
| POST | `/auth/login` | `{ login, password }` → `{ accessToken, user }` |
| GET | `/auth/me` | текущий пользователь |

### Админка (ADMIN и MANAGER)

| Метод | Путь | Описание |
| --- | --- | --- |
| GET | `/admin/products` | список, включая скрытые; фильтры как у каталога + `isActive`, `categoryId`, `brandId` |
| GET | `/admin/products/:id` | товар по id |
| POST | `/admin/products` | создать |
| PATCH | `/admin/products/:id` | изменить; переданные `images` / `specs` полностью заменяют старые |
| PATCH | `/admin/products/:id/stock` | `{ stock }` — быстро поменять остаток |
| DELETE | `/admin/products/:id` | удалить |
| GET/POST | `/admin/categories` | список (плоский) / создать |
| GET/PATCH/DELETE | `/admin/categories/:id` | получить / изменить / удалить (нельзя, если есть товары или подкатегории → 409) |
| GET/POST | `/admin/brands` | список / создать |
| GET/PATCH/DELETE | `/admin/brands/:id` | получить / изменить / удалить (у товаров бренд обнуляется) |
| POST | `/admin/uploads` | `multipart/form-data`, поле `file`: JPEG/PNG/WebP/AVIF до 5 МБ → `{ url }` |
| DELETE | `/admin/uploads/:filename` | удалить файл (409, если он где-то используется) |

Фото, которые больше нигде не используются (после удаления товара, замены `images`, смены картинки категории или логотипа бренда), удаляются с диска автоматически.

### Только ADMIN

| Метод | Путь | Описание |
| --- | --- | --- |
| GET/POST | `/admin/users` | сотрудники / создать `{ login, password, name?, role? }` |
| PATCH/DELETE | `/admin/users/:id` | изменить / удалить (себя и последнего администратора удалить нельзя) |

Смена пароля или роли сотрудника сразу делает его старые токены недействительными.

### Пример создания товара

```bash
curl -X POST localhost:4000/api/admin/products \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{
    "name": "Sony PlayStation 5 Slim",
    "sku": "SNY-PS5-SLIM",
    "description": "Игровая консоль",
    "price": 54990,
    "stock": 3,
    "categoryId": 1,
    "images": [{ "url": "/uploads/<файл из /admin/uploads>", "alt": "PS5" }],
    "specs": [{ "group": "Память", "name": "SSD", "value": "1 ТБ" }]
  }'
```

## Правила и ошибки

- `slug` генерируется из названия и при совпадении получает номер: `apple`, `apple-2`…
- `oldPrice` должна быть больше `price`; ссылки на фото — только `/uploads/...` или `http(s)://`.
- Загруженный файл проверяется по содержимому, а не только по заголовку `Content-Type`.
- Вход: не больше 10 попыток в минуту с одного IP, на всё API — 300 запросов в минуту.

Коды ответов: `400` — ошибка валидации (лишние поля тоже отклоняются), `401` — нет токена или он отозван, `403` — не хватает роли, `404` — не найдено, `409` — конфликт (занятый slug или артикул, удаление связанной записи), `413` — слишком большой файл, `429` — слишком много запросов.
