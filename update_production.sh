#!/bin/bash

# Скрипт быстрого обновления ProjectX 
# Использование: bash update_production.sh

set -e

echo "🚀 Обновление ProjectX на продакшене..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"
}

# 1. Обновление кода
log "📥 Получение последних изменений..."
cd /opt/projectx
git pull origin main

# 2. Обновление backend
log "⚙️ Обновление backend..."
cd backend
npm install --production
pm2 restart projectx-api

# 3. Обновление frontend
log "🎨 Обновление frontend..."
cd ../frontend
npm install
npm run build
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/
chown -R www-data:www-data /var/www/html/

# 4. Обновление nginx конфигурации для CORS
log "🌐 Обновление nginx конфигурации..."

# Обновленная конфигурация основного сайта с CORS для изображений
cat > /etc/nginx/sites-available/schoolactive.ru << 'EOF'
server {
    listen 80;
    server_name schoolactive.ru www.schoolactive.ru;
    
    root /var/www/html;
    index index.html index.htm;
    
    location / {
        try_files $uri $uri/ /index.html;
        
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Добавляем CORS заголовки для изображений
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
    }
    
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Добавляем CORS заголовки для uploads
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
    }
}
EOF

# Обновленная конфигурация API с CORS
cat > /etc/nginx/sites-available/api.schoolactive.ru << 'EOF'
server {
    listen 80;
    server_name api.schoolactive.ru;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS заголовки
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        
        # Отключить кеширование
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        
        # Увеличить таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Обработка preflight запросов
    location ~* \.(OPTIONS)$ {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 200;
    }
}
EOF

# Проверить и перезагрузить nginx
nginx -t && systemctl reload nginx

# 5. Проверка работы
log "🔍 Проверка работы..."
sleep 3

# Проверка PM2
if pm2 list | grep -q "online"; then
    log "✅ Backend обновлен и работает"
else
    warn "⚠️ Проблемы с backend, проверьте логи: pm2 logs projectx-api"
fi

# Проверка nginx
if systemctl is-active --quiet nginx; then
    log "✅ Nginx перезагружен"
else
    warn "⚠️ Проблемы с nginx"
fi

# Проверка API
if curl -s http://localhost:5000/api/health > /dev/null; then
    log "✅ API отвечает"
else
    warn "⚠️ API не отвечает"
fi

log "🎉 Обновление завершено!"
log "🌐 Сайт: http://schoolactive.ru"
log "🔧 API: http://api.schoolactive.ru"

echo ""
echo "📊 Статус сервисов:"
pm2 list
echo ""
echo "📋 Последние 10 строк логов:"
pm2 logs projectx-api --lines 10
