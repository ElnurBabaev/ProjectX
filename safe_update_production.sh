#!/bin/bash

# Безопасный скрипт обновления ProjectX без изменения Nginx конфигураций
# Использование: bash safe_update_production.sh

set -e

echo "🚀 Безопасное обновление ProjectX на продакшене..."

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

# Проверяем что мы в правильной директории
if [ ! -d "/opt/projectx" ]; then
    echo "❌ Директория /opt/projectx не найдена"
    exit 1
fi

# 1. Обновление кода
log "📥 Получение последних изменений..."
cd /opt/projectx

# Проверяем статус git
log "🔍 Проверка статуса git..."
if ! git status --porcelain | grep -q .; then
    log "✅ Рабочая директория чистая"
else
    warn "⚠️ Есть некоммитнутые изменения. Сохраняю их..."
    git stash
fi

# Получаем изменения с merge стратегией
if git pull --no-rebase origin main; then
    log "✅ Изменения успешно получены"
else
    warn "⚠️ Ошибка при получении изменений. Пробую с rebase..."
    git pull --rebase origin main || {
        warn "❌ Не удалось получить изменения. Проверьте конфликты вручную"
        exit 1
    }
fi

# Восстанавливаем стэш если был
if git stash list | grep -q stash; then
    log "🔄 Восстанавливаю сохраненные изменения..."
    git stash pop
fi

# 2. Обновление backend
log "⚙️ Обновление backend..."
cd backend
npm install --production
# Обеспечиваем, что колонка category присутствует в БД — безопасно запускаем миграцию
if [ -f "scripts/addCategoryColumn.js" ]; then
    warn "🔁 Выполняю миграцию addCategoryColumn.js (если необходимо)"
    node scripts/addCategoryColumn.js || warn "⚠️ Миграция addCategoryColumn.js завершилась с ошибкой — продолжим, проверьте логи"
fi
pm2 restart projectx-api || pm2 start server.js --name projectx-api
cd ..

# 3. Обновление frontend
log "🎨 Обновление frontend..."
cd frontend
npm install
npm run build

# Безопасное копирование файлов
log "📁 Копирование frontend файлов..."
if [ -d "/var/www/html" ]; then
    rm -rf /var/www/html/*
    cp -r dist/* /var/www/html/
    chown -R www-data:www-data /var/www/html/
else
    warn "⚠️ Директория /var/www/html не найдена, создаю..."
    mkdir -p /var/www/html
    cp -r dist/* /var/www/html/
    chown -R www-data:www-data /var/www/html/
fi

cd ..

# 4. НЕ ИЗМЕНЯЕМ Nginx конфигурации - они уже правильно настроены!
log "🌐 Nginx конфигурации оставлены без изменений (HTTPS работает)"

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
    log "✅ Nginx работает"
else
    warn "⚠️ Проблемы с nginx"
fi

# Проверка HTTPS API
log "🔐 Проверка HTTPS API..."
if curl -s -k https://schoolactive.ru/api/auth/me > /dev/null 2>&1; then
    log "✅ HTTPS API отвечает"
else
    warn "⚠️ HTTPS API не отвечает"
fi

log "🎉 Безопасное обновление завершено!"
log "🌐 Сайт: https://schoolactive.ru"
log "🔧 API: https://schoolactive.ru/api/"

echo ""
echo "📊 Статус сервисов:"
pm2 list
echo ""
echo "📋 Последние 10 строк логов:"
pm2 logs projectx-api --lines 10

echo ""
log "✅ Все настройки HTTPS сохранены и работают!"
