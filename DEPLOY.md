# Деплой

Весь проект поднимается одной командой: база, миграции, API, витрина и nginx
в Docker. Инструкция рассчитана на чистый сервер с Ubuntu/Debian.

```
                      ┌─────────── nginx :80/:443 ───────────┐
браузер ──────────────┤  /            → web  (Next.js :3000) │
                      │  /api/        → api  (NestJS :4000)  │
                      │  /uploads/    → файлы с диска        │
                      └──────────────────────────────────────┘
                                   web ──► api ──► postgres
```

Сайт, API и фотографии живут на одном домене, поэтому браузеру не нужен CORS,
а адрес API в сборке витрины — просто `/api`.

## 1. Что нужно на сервере

* Docker Engine 24+ с плагином Compose (`docker compose version`).
* Домен, A-запись которого указывает на сервер (для HTTPS).
* Открытые порты 80 и 443.
* ~2 ГБ свободной памяти: сборка образа витрины требовательна к ней.

Установка Docker на чистом сервере:

```bash
curl -fsSL https://get.docker.com | sh
```

## 2. Первый запуск

```bash
git clone <адрес-репозитория> /srv/electronica
cd /srv/electronica
cp .env.example .env
```

Заполните `.env` — обязательны `POSTGRES_PASSWORD`, `JWT_SECRET`,
`ADMIN_PASSWORD` и `SITE_URL`. Секреты удобно сгенерировать так:

```bash
openssl rand -base64 24                                              # POSTGRES_PASSWORD
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"  # JWT_SECRET
```

Сборка и запуск:

```bash
docker compose up -d --build
```

Compose выполнит всё по порядку: поднимет Postgres, дождётся его готовности,
накатит миграции отдельным контейнером `migrate`, запустит API, затем витрину
и только после их проверок здоровья — nginx.

Создайте администратора:

```bash
docker compose exec api node dist/seed.js
```

Команда идемпотентна: существующие записи не перезаписываются, пароль
действующего администратора не меняется. При `SEED_DEMO=false` (значение по
умолчанию в `.env.example`) создаётся только администратор, без демо-каталога.

Проверка:

```bash
curl -i http://localhost/api/health     # {"status":"ok"}
docker compose ps                       # все контейнеры healthy
```

Админка — `http://<домен>/admin`, логин и пароль из `.env`. **Смените пароль
администратора в разделе «Настройки» сразу после первого входа.**

## 3. HTTPS

Сертификат Let's Encrypt выпускается через тот же nginx (проверка по файлу
в `/.well-known/acme-challenge/`). Сайт при этом должен уже открываться по
http на вашем домене.

```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d example.com -d www.example.com \
  --email admin@example.com --agree-tos --no-eff-email
```

Включите https-конфигурацию:

```bash
cd deploy/nginx/conf.d
# ДОМЕН — ваш домен; в шаблоне он встречается в server_name и путях к сертификату
sed 's/example\.com/ДОМЕН/g' app-ssl.conf.example > app-ssl.conf
mv app.conf app.conf.disabled                 # nginx читает только файлы *.conf
cd /srv/electronica
docker compose exec nginx nginx -t && docker compose exec nginx nginx -s reload
```

В `.env` поменяйте `SITE_URL` на `https://...` и перезапустите API, чтобы
обновился список разрешённых источников:

```bash
docker compose up -d api
```

Автопродление — строкой в cron хоста (сертификат живёт 90 дней, certbot
обновляет его, только если осталось меньше 30):

```bash
0 3 * * * cd /srv/electronica && docker compose run --rm certbot renew --quiet && docker compose exec -T nginx nginx -s reload
```

## 4. Обновление версии

```bash
cd /srv/electronica
git pull
docker compose up -d --build
```

Миграции накатываются автоматически перед стартом API. Простой — несколько
секунд на перезапуск контейнеров.

Откат к предыдущей версии кода:

```bash
git checkout <прошлый-коммит>
docker compose up -d --build
```

Обратные миграции Prisma не делает — если в новой версии были изменения схемы,
базу восстанавливают из резервной копии.

## 5. Резервные копии

```bash
./deploy/backup.sh              # база + фотографии в ./backups
```

Скрипт сам удаляет копии старше двух недель. В cron:

```bash
30 3 * * * cd /srv/electronica && ./deploy/backup.sh >> /var/log/electronica-backup.log 2>&1
```

Восстановление описано в комментариях в начале `deploy/backup.sh`.
Данные живут в томах Docker и переживают пересборку образов:

| Том                   | Что внутри              |
| --------------------- | ----------------------- |
| `electronica_pgdata`  | база данных             |
| `electronica_uploads` | фотографии товаров      |
| `electronica_certbot-conf` | сертификаты        |

`docker compose down` тома не трогает. Удаляет их только `down -v` — этой
командой на боевом сервере пользоваться не нужно.

## 6. Диагностика

```bash
docker compose ps                     # состояние и healthcheck
docker compose logs -f api            # логи API
docker compose logs -f web nginx      # витрина и nginx
docker compose exec nginx nginx -t    # проверка конфигурации nginx
docker stats                          # потребление памяти
```

Логи ограничены пятью файлами по 10 МБ на контейнер — диск не переполнится.

Частое:

* **502 на всём сайте** — не поднялась витрина или API. Смотрите
  `docker compose logs web api`; при нехватке памяти сборка Next падает.
* **«Invalid Server Actions request» в логах web** — nginx не передал
  `X-Forwarded-Host`. Проверьте, что подключается `snippets/proxy.conf`.
* **Фотографии не открываются** — том `uploads` смонтирован в nginx только
  для чтения по пути `/var/www/uploads`; проверьте `docker compose config`.
* **API не стартует** — валидация переменных окружения. Сообщение с точной
  причиной («JWT_SECRET должен быть не короче 32 символов» и т.п.) будет
  первым в `docker compose logs api`.
* **Смена `NEXT_PUBLIC_API_URL`** требует пересборки витрины: значение
  попадает в браузерный код на этапе `docker compose build web`.

## 7. Что стоит сделать после запуска

* Сменить пароль администратора в админке.
* Настроить уведомления о заказах в Telegram (админка → Настройки).
* Закрыть на сервере всё, кроме 22, 80 и 443:
  `ufw allow 22,80,443/tcp && ufw enable`.
* Поставить cron на резервные копии и продление сертификата.
