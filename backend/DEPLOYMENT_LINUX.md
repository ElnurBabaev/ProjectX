# Деплой на Linux VPS (Ubuntu/Debian)

Это краткое пошаговое руководство для продакшн-деплоя API на домен `api.schoolactive.ru` через Node.js + Nginx + PM2 и SQLite.

## 1) Системные пакеты

- Node.js LTS (18/20)
- Nginx
- PM2 (глобально)

```
# Node.js LTS (пример для Ubuntu 22.04):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx
sudo apt-get install -y nginx

# PM2
sudo npm i -g pm2
```

## 2) Директории

- Код: `/opt/projectx/app`
- Данные: `/var/lib/projectx` (БД и uploads)

```
sudo mkdir -p /opt/projectx/app
sudo mkdir -p /var/lib/projectx/uploads
sudo chown -R $USER:$USER /opt/projectx /var/lib/projectx
```

Скопируйте репозиторий в `/opt/projectx/app` (git pull/rsync/scp).

## 3) Backend .env

Создайте `/opt/projectx/app/backend/.env`:

```
NODE_ENV=production
PORT=5000
HOST=127.0.0.1
TRUST_PROXY=1

JWT_SECRET=<сильный_секрет>

CORS_ORIGINS=https://schoolactive.ru,http://schoolactive.ru

UPLOADS_DIR=/var/lib/projectx/uploads
SQLITE_DB_PATH=/var/lib/projectx/database.sqlite
```

## 4) Установка зависимостей и миграции

```
cd /opt/projectx/app/backend
npm ci || npm install
node scripts/ensurePointsSchema.js
# опционально
node recalculate-all.js
```

## 5) PM2

```
pm2 start /opt/projectx/app/backend/server.js --name projectx-api
pm2 save
pm2 startup  # выполните команду, которую подскажет PM2
```

Перезагрузка без простоя:
```
pm2 reload projectx-api
```

Логи:
```
pm2 logs projectx-api
```

## 6) Nginx как reverse proxy (+ HTTPS)

Создайте конфиг `/etc/nginx/sites-available/api.schoolactive.ru` по образцу из `backend/deploy/nginx/api.schoolactive.ru` и включите его:

```
sudo ln -s /etc/nginx/sites-available/api.schoolactive.ru /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Сертификаты (Let’s Encrypt):
```
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.schoolactive.ru
```

## 7) Бэкапы

- `/var/lib/projectx/database.sqlite` — через `sqlite3 ".backup"`
- `/var/lib/projectx/uploads` — tar/rsync по расписанию

## 8) Проверка

- GET https://api.schoolactive.ru/api/health
- Основные эндпоинты: `/api/auth`, `/api/events`, `/api/achievements`, `/api/products`, `/api/admin`, `/api/rankings`

Готово. Теперь фронтенд используйте с переменной `VITE_API_URL=https://api.schoolactive.ru/api`.
