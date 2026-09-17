#!/bin/sh
# Резервная копия базы и фотографий товаров.
#
#   ./deploy/backup.sh [каталог]     # по умолчанию ./backups
#   crontab -e →  30 3 * * *  cd /srv/electronica && ./deploy/backup.sh
#
# Восстановление базы:
#   gunzip -c backups/db-2026-01-01.sql.gz | \
#     docker compose exec -T postgres psql -U electronica -d electronica
# Восстановление фотографий:
#   docker run --rm -v electronica_uploads:/data -v "$PWD/backups:/backup" \
#     alpine tar xzf /backup/uploads-2026-01-01.tar.gz -C /data

set -eu

cd "$(dirname "$0")/.."
DIR=${1:-./backups}
DAY=$(date +%F)
KEEP_DAYS=14

mkdir -p "$DIR"

# Имя пользователя и базы берём из окружения самого контейнера,
# чтобы не разбирать .env.
echo "База → $DIR/db-$DAY.sql.gz"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip > "$DIR/db-$DAY.sql.gz"

echo "Фотографии → $DIR/uploads-$DAY.tar.gz"
docker run --rm \
  -v electronica_uploads:/data:ro \
  -v "$(pwd)/$DIR:/backup" \
  alpine tar czf "/backup/uploads-$DAY.tar.gz" -C /data .

# Чистим копии старше двух недель.
find "$DIR" -name '*.gz' -type f -mtime +$KEEP_DAYS -delete

echo "Готово: $(ls -lh "$DIR/db-$DAY.sql.gz" | awk '{print $5}') базы"
