# Руководство по деплою и сохранности данных

Практичная пошаговая инструкция по развёртыванию приложения (Frontend + Backend + SQLite) на своём сервере/хостинге с подключением домена и HTTPS, плюс защита данных от потерь при обновлениях.

## Что входит в систему

- Frontend: React + Vite (статический билд `frontend/dist`)
- Backend: Node.js + Express (порт по умолчанию 5000)
- База данных: SQLite (один `.sqlite` файл)
- Файлы пользователей: директория `uploads` (аватары и пр.)

## Цели

- Безопасный, повторяемый деплой на внешний сервер с доменом и HTTPS
- Сохранность данных (SQLite и uploads) при обновлениях кода

---

## Базовый принцип: код отдельно, данные отдельно

Данные (БД и загрузки) храним вне папки с кодом. При деплое заменяем только код — данные остаются нетронутыми.

Рекомендуемые пути:

- Linux: код `/opt/projectx/app`, данные `/var/lib/projectx` (внутри: `database.sqlite`, `uploads/`)
- Windows: код `C:\ProjectX\app`, данные `C:\ProjectX\data` (внутри: `database.sqlite`, `uploads\`)

---

## Переменные окружения (backend/.env)

Создайте файл `.env` рядом с `backend/server.js`:

```
PORT=5000
NODE_ENV=production
JWT_SECRET=установите_сильный_секрет
SQLITE_DB_PATH=/путь/к/постоянной/database.sqlite
```

Примеры путей:
- Linux: `SQLITE_DB_PATH=/var/lib/projectx/database.sqlite`
- Windows: `SQLITE_DB_PATH=C:\ProjectX\data\database.sqlite`

Важно: добавьте ваш продакшн-домен фронтенда в CORS в `backend/server.js` (массив `origin`).

---

## Сценарий A: Ubuntu 22.04+ (Nginx + PM2 + Let’s Encrypt)

Эти команды выполняются на сервере (bash).

### 1) Подготовка сервера

```bash
sudo apt update && sudo apt -y upgrade
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs git nginx certbot python3-certbot-nginx
```

### 2) Директории кода и данных

```bash
sudo mkdir -p /opt/projectx/app
sudo mkdir -p /var/lib/projectx/{uploads,backups}
sudo touch /var/lib/projectx/database.sqlite
sudo chown -R $USER:$USER /opt/projectx/app /var/lib/projectx
```

### 3) Развёртывание кода и зависимости

```bash
cd /opt/projectx/app
git clone <URL_ВАШЕГО_РЕПО> .
cd backend && npm install
cd ../frontend && npm install && npm run build
```

### 4) .env backend

```
PORT=5000
NODE_ENV=production
JWT_SECRET=Задайте_надежный_секрет
SQLITE_DB_PATH=/var/lib/projectx/database.sqlite
```

### 5) uploads как постоянное хранилище

```bash
rm -rf /opt/projectx/app/backend/uploads
ln -s /var/lib/projectx/uploads /opt/projectx/app/backend/uploads
```

### 6) PM2: запуск API как сервиса

```bash
sudo npm i -g pm2
cd /opt/projectx/app/backend
pm2 start server.js --name projectx-api
pm2 save
# автозапуск
pm2 startup systemd -u $USER --hp $HOME
```

Проверка: `curl http://127.0.0.1:5000/api/health`

### 7) Nginx: домен, статика и proxy `/api`

Создайте `/etc/nginx/sites-available/projectx`:

```
server {
      listen 80;
      server_name your-domain.tld www.your-domain.tld;

      root /opt/projectx/app/frontend/dist;
      index index.html;

      location / {
            try_files $uri /index.html;
      }

      location /api/ {
            proxy_pass http://127.0.0.1:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
      }

      location /uploads/ {
            alias /var/lib/projectx/uploads/;
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
      }
}
```

Активируйте сайт и перезапустите Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/projectx /etc/nginx/sites-enabled/projectx
sudo nginx -t && sudo systemctl reload nginx
```

### 8) HTTPS (Let’s Encrypt)

```bash
sudo certbot --nginx -d your-domain.tld -d www.your-domain.tld --redirect --agree-tos --register-unsafely-without-email
```

### 9) CORS и домен фронтенда

В `backend/server.js` добавьте:

```js
origin: [
   'http://localhost:3000',
   'http://localhost:5173',
   'https://your-domain.tld',
   'https://www.your-domain.tld'
],
```

Перезапуск: `pm2 reload projectx-api`

### 10) Обновления без простоя и без потери данных

```bash
cd /opt/projectx/app
git pull
cd backend && npm install && cd ../frontend && npm run build
pm2 reload projectx-api
```

Данные в `/var/lib/projectx/` не трогаем.

### 11) Бэкапы

```bash
# Бэкап БД
sqlite3 /var/lib/projectx/database.sqlite ".backup '/var/lib/projectx/backups/database-$(date +%F).sqlite'"

# Бэкап загрузок
tar -czf /var/lib/projectx/backups/uploads-$(date +%F).tar.gz -C /var/lib/projectx uploads
```

---

## Сценарий B: Windows Server (IIS/Caddy + PM2/NSSM)

Эти шаги выполняются в PowerShell.

### 1) Директории

```powershell
New-Item -ItemType Directory -Force -Path "C:\ProjectX\app" | Out-Null
New-Item -ItemType Directory -Force -Path "C:\ProjectX\data\uploads" | Out-Null
New-Item -ItemType File -Force -Path "C:\ProjectX\data\database.sqlite" | Out-Null
```

### 2) Код и зависимости

```powershell
# Скопируйте проект в C:\ProjectX\app
Set-Location C:\ProjectX\app\backend
npm install
Set-Location C:\ProjectX\app\frontend
npm install; npm run build
```

### 3) .env backend

```
PORT=5000
NODE_ENV=production
JWT_SECRET=Задайте_надежный_секрет
SQLITE_DB_PATH=C:\ProjectX\data\database.sqlite
```

### 4) uploads как постоянное хранилище (джанкшн)

```powershell
if (Test-Path "C:\ProjectX\app\backend\uploads") { Remove-Item -Recurse -Force "C:\ProjectX\app\backend\uploads" }
cmd /c mklink /J "C:\ProjectX\app\backend\uploads" "C:\ProjectX\data\uploads"
```

### 5) Сервис backend

- Вариант A (PM2):

```powershell
npm i -g pm2
Set-Location C:\ProjectX\app\backend
pm2 start server.js --name projectx
pm2 save
# Для автозапуска установите pm2-windows-service по их инструкции
```

- Вариант B (NSSM):
   - Application: `C:\Program Files\nodejs\node.exe`
   - Arguments: `server.js`
   - AppDirectory: `C:\ProjectX\app\backend`
   - Environment: `NODE_ENV=production;PORT=5000;SQLITE_DB_PATH=C:\ProjectX\data\database.sqlite;JWT_SECRET=...`

### 6) Домены и HTTPS (IIS или Caddy)

- Caddy (проще всего):

```
your-domain.tld, www.your-domain.tld {
   root * C:\ProjectX\app\frontend\dist
   file_server

   @api path /api/*
   reverse_proxy @api 127.0.0.1:5000

   handle_path /uploads/* {
      root * C:\ProjectX\data
      file_server
      header {
         Access-Control-Allow-Origin "*"
         Access-Control-Allow-Methods "GET, OPTIONS"
         Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept"
      }
   }
}
```

- IIS:
   - Включите URL Rewrite и ARR, сайт указывает на `C:\ProjectX\app\frontend\dist`
   - Прокси `/api/*` на `http://127.0.0.1:5000`
   - SSL можно выпустить через win-acme (Let’s Encrypt для IIS)

### 7) CORS

Добавьте продакшн-домен в массив `origin` в `backend/server.js` и перезапустите службу/PM2.

### 8) Обновления

Обновляйте только `C:\ProjectX\app` (код), не трогая `C:\ProjectX\data` (данные):

```powershell
Set-Location C:\ProjectX\app
# обновите код (git pull/копирование)
Set-Location .\backend; npm install
Set-Location ..\frontend; npm run build
# перезапуск
pm2 reload projectx
```

### 9) Бэкапы (Windows)

- БД через `sqlite3.exe` с командой `.backup`
- Архивация `C:\ProjectX\data\uploads` по расписанию

---

## Сборка и запуск (локальная проверка)

Frontend:
```
cd frontend
npm install
npm run build
```

Backend:
```
cd backend
npm install
node scripts/ensurePointsSchema.js
node recalculate-all.js
node server.js
```

Health-check: `GET /api/health`

---

## Мини-чеклист перед продакшеном

- [ ] `JWT_SECRET` установлен (и не хранится в репозитории)
- [ ] `SQLITE_DB_PATH` указывает на постоянный путь (Linux `/var/lib/projectx/database.sqlite` или Windows `C:\ProjectX\data\database.sqlite`)
- [ ] `uploads` вынесены в постоянное хранилище (симлинк/джанкшн) либо исключены из очистки при деплое
- [ ] Настроены домен и HTTPS (Caddy/Nginx/IIS), `/api` проксируется на `127.0.0.1:5000`
- [ ] CORS в `server.js` содержит ваш продакшн-домен
- [ ] Backend работает как сервис (PM2/NSSM/systemd)
- [ ] Настроены регулярные бэкапы БД и загрузок

---

## Типичные проблемы и решения

- Порт 5000 занят — смените порт в `.env` или остановите конфликтующий процесс
- CORS ошибки — добавьте ваш домен фронтенда в `origin` в `server.js`
- Не грузятся аватары — проверьте доступность и путь к `uploads`
- Дробные очки — API округляет до целых, проверьте форматирование на фронтенде

---

## Express может отдавать фронтенд (опционально)

Если не хотите отдельный веб-сервер:
- Скопируйте `frontend/dist` в доступную для backend папку (например, `.../app/frontend/dist`)
- Добавьте в `server.js` раздачу статики `dist` и catch-all маршрут на `index.html`

---

Готово! Схема «код отдельно, данные отдельно» гарантирует безопасные обновления без потери БД и пользовательских файлов, а сервис стабильно работает и автоматически перезапускается.