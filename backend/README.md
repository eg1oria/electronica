# Electronica — бэкенд

API магазина электроники: каталог товаров, категории, бренды, характеристики, заказы, загрузка фото и защищённые эндпоинты для админки.

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

`backend/docker-compose.yml` поднимает только Postgres для локальной разработки
(`npm run db:up`) — API при этом запускается на хосте.

Весь стек в контейнерах (база, миграции, API, витрина, nginx) — в корне
репозитория: `docker-compose.yml` и [DEPLOY.md](../DEPLOY.md).

```bash
cd ..
cp .env.example .env               # JWT_SECRET, POSTGRES_PASSWORD, ADMIN_PASSWORD
docker compose up -d --build
docker compose exec api node dist/seed.js   # админ (+ демо-каталог при SEED_DEMO=true)
```

- `Dockerfile` собирает два образа: `migrator` (Prisma CLI, применяет миграции и завершается) и `runner` (только `dist` и prod-зависимости). `api` стартует после успешных миграций.
- Фото хранятся в volume `uploads`, база — в volume `pgdata`.
- `api` работает от пользователя `node`, у контейнера есть `HEALTHCHECK` на `/api/health`.
- За nginx задайте `TRUST_PROXY=1`, чтобы лимиты запросов считались по реальному IP.
- `SEED_DEMO=false` — сид создаёт только администратора, без демо-каталога.

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
- **Order** — `status` (`NEW` → `CONFIRMED` → `SHIPPED` → `COMPLETED`, либо `CANCELLED`), `customerName`, `phone`, `email`, `delivery` (`COURIER` · `PICKUP`), `city`, `address`, `apartment`, `payment` (`ON_DELIVERY` · `INSTALLMENT`), `comment`, `total`
  - **items[]** — снимок товара на момент заказа: `productId` (пусто, если товар удалён), `name`, `sku`, `price`, `qty`
- **User** — сотрудник админки: `login`, `name`, `role` (`ADMIN` · `MANAGER`), `tokenVersion`. Первый администратор создаётся `npm run db:seed` из `ADMIN_LOGIN` / `ADMIN_PASSWORD`, остальных заводят в разделе «Сотрудники»
  - `MANAGER` работает с каталогом, баннерами и заказами; `ADMIN` дополнительно управляет сотрудниками и настройками магазина
  - смена пароля или роли увеличивает `tokenVersion` — выданные раньше токены сразу перестают действовать
- **Settings** — одна строка с настройками магазина: токен Telegram-бота, его `@username`, чат для уведомлений и флаг `telegramEnabled`

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
| GET | `/banners` | слайды главной: включённые, с опубликованными товарами, по порядку |
| POST | `/orders` | оформить заказ (см. ниже) |
| GET | `/uploads/:file` | загруженные изображения |
| GET | `/health` | проверка API и БД |

Параметры `GET /products`: `search`, `categorySlug` (включая подкатегории), `brandSlug`, `minPrice`, `maxPrice`, `inStock`, `isFeatured`, `sort` (`newest` · `price_asc` · `price_desc` · `name`), `page`, `limit` (≤ 100).
Ответ: `{ items, total, page, limit }`.

### Оформление заказа

```json
{
  "customerName": "Иван Петров",
  "phone": "+7 700 123 45 67",
  "email": null,
  "delivery": "COURIER",
  "city": "Алматы",
  "address": "ул. Абая, 1",
  "apartment": "12",
  "payment": "ON_DELIVERY",
  "comment": null,
  "items": [{ "productId": 1, "qty": 2 }]
}
```

- Для `COURIER` обязательны `city` и `address`; при `PICKUP` адрес не сохраняется.
- Цены и сумма берутся из базы, клиент передаёт только `productId` и `qty` (1–99); одинаковые позиции складываются.
- Остатки списываются в той же транзакции. Товар скрыт или удалён → `409`, не хватает на складе → `409` с текстом «в наличии только N шт.».
- Не больше 10 заказов в минуту с одного IP.

### Авторизация

| Метод | Путь | Описание |
| --- | --- | --- |
| POST | `/auth/login` | `{ login, password }` → `{ accessToken, user }` |
| GET | `/auth/me` | текущий пользователь |
| PATCH | `/auth/password` | `{ currentPassword, newPassword }` → `{ accessToken }`; сессии на других устройствах закрываются, текущая получает новый токен |

### Админка

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
| GET/POST | `/admin/banners` | слайды главной / создать `{ productId, badge?, title?, subtitle?, image?, isActive? }` (не больше 5 → 409) |
| GET/PATCH/DELETE | `/admin/banners/:id` | получить / изменить / удалить |
| PUT | `/admin/banners/order` | `{ ids }` — все id в новом порядке |
| GET | `/admin/orders` | заказы, новые сверху; `status`, `search` (номер `№12`, имя, телефон, email), `page`, `limit` |
| GET | `/admin/orders/stats` | количество заказов по статусам |
| GET | `/admin/orders/:id` | заказ с позициями |
| PATCH | `/admin/orders/:id` | `{ status }`; отмена возвращает товары на склад, отменённый заказ изменить нельзя (400) |
| GET/POST | `/admin/users` | сотрудники / создать `{ login, password, name?, role? }` (только `ADMIN`) |
| GET/PATCH/DELETE | `/admin/users/:id` | получить / изменить (`login`, `name`, `role`, `password`) / удалить |
| GET/PUT | `/admin/settings/telegram` | настройки уведомлений / сохранить `{ botToken?, chatId?, enabled? }` |
| POST | `/admin/settings/telegram/test` | отправить тестовое сообщение в чат |
| POST | `/admin/settings/telegram/chats` | чаты, которые недавно писали боту, — чтобы выбрать `chatId` |
| POST | `/admin/uploads` | `multipart/form-data`, поле `file`: JPEG/PNG/WebP/AVIF до 5 МБ → `{ url }` |
| DELETE | `/admin/uploads/:filename` | удалить файл (409, если он где-то используется) |

Фото, которые больше нигде не используются (после удаления товара, замены `images`, смены картинки категории или логотипа бренда), удаляются с диска автоматически.

### Сотрудники

- Разделы `/admin/users/*` и `/admin/settings/*` доступны только роли `ADMIN`, остальные админские эндпоинты — обеим ролям.
- Нельзя удалить себя, изменить себе роль и снять роль с последнего администратора → `400`.
- Пароль — не короче 8 символов; наружу отдаются только `id`, `login`, `name`, `role` и даты.

### Уведомления о заказах в Telegram

Настраивается из админки (раздел «Настройки»), переменные окружения не нужны:

1. `@BotFather` → `/newbot` → скопировать токен.
2. `PUT /admin/settings/telegram` с `{ "botToken": "123456789:AA..." }` — токен проверяется через `getMe`, сохраняется `@username` бота. Неверный токен → `400`; если Telegram недоступен, токен всё равно сохранится (в логе будет предупреждение).
3. Отправить боту `/start` (или добавить его в группу) и вызвать `POST /admin/settings/telegram/chats`, чтобы получить список чатов с их `id`.
4. Сохранить `chatId` и `enabled: true` — включить уведомления без токена и чата нельзя (`400`).

Каждый новый заказ уходит в чат: номер, покупатель, состав, сумма, доставка и оплата. Отправка не блокирует оформление: ошибка Telegram только пишется в лог. Токен наружу не отдаётся — в ответе только `tokenPreview` вида `123456789:••••ab12`. Пустая строка в `botToken` стирает токен, `{ "botToken": "", "chatId": "", "enabled": false }` полностью отключает бота.

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
- Вход и оформление заказа: не больше 10 запросов в минуту с одного IP, на всё API — 300 запросов в минуту.

Коды ответов: `400` — ошибка валидации (лишние поля тоже отклоняются), `401` — нет токена или он отозван, `403` — не хватает роли, `404` — не найдено, `409` — конфликт (занятый slug или артикул, удаление связанной записи), `413` — слишком большой файл, `429` — слишком много запросов.
