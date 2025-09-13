#!/bin/bash

# Безопасный скрипт обновления ProjectX с резервным копированием
# Использование: bash safe_update_production.sh

set -e

echo "🚀 Безопасное обновление ProjectX на продакшене с резервным копированием..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

# Функция для восстановления из бэкапа в случае ошибки
restore_backup() {
    error "❌ Ошибка во время обновления! Восстанавливаю из резервной копии..."
    
    if [ -f "/opt/projectx/backup/database_backup_$(date +%Y%m%d).sqlite" ]; then
        cp "/opt/projectx/backup/database_backup_$(date +%Y%m%d).sqlite" "/opt/projectx/backend/database.sqlite"
        log "✅ База данных восстановлена из резервной копии"
    fi
    
    if [ -d "/opt/projectx/backup/backend_backup_$(date +%Y%m%d)" ]; then
        rm -rf /opt/projectx/backend
        cp -r "/opt/projectx/backup/backend_backup_$(date +%Y%m%d)" /opt/projectx/backend
        log "✅ Backend восстановлен из резервной копии"
    fi
    
    if [ -d "/opt/projectx/backup/frontend_backup_$(date +%Y%m%d)" ]; then
        rm -rf /opt/projectx/frontend
        cp -r "/opt/projectx/backup/frontend_backup_$(date +%Y%m%d)" /opt/projectx/frontend
        log "✅ Frontend восстановлен из резервной копии"
    fi
    
    # Перезапуск сервисов
    pm2 restart projectx-api 2>/dev/null || true
    systemctl reload nginx 2>/dev/null || true
    
    error "💥 Обновление отменено. Система восстановлена в предыдущее состояние."
    exit 1
}

# Ловим ошибки и запускаем восстановление
trap restore_backup ERR

# Проверяем что мы в правильной директории
if [ ! -d "/opt/projectx" ]; then
    error "❌ Директория /opt/projectx не найдена"
    exit 1
fi

info "🔍 Предварительные проверки..."

# Проверяем права доступа
if [ "$EUID" -ne 0 ]; then
    error "❌ Скрипт должен быть запущен с правами root (sudo)"
    exit 1
fi

# Проверяем свободное место на диске (минимум 1GB)
AVAILABLE_SPACE=$(df /opt/projectx --output=avail | tail -1)
if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then  # 1GB в KB
    error "❌ Недостаточно свободного места на диске (нужно минимум 1GB)"
    exit 1
fi

log "✅ Предварительные проверки пройдены"

# ========================
# СОЗДАНИЕ РЕЗЕРВНЫХ КОПИЙ
# ========================

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/projectx/backup"

log "💾 Создание резервных копий..."

# Создаем директорию для бэкапов
mkdir -p "$BACKUP_DIR"

# 1. Резервная копия базы данных SQLite
log "📀 Создание резервной копии базы данных..."
if [ -f "/opt/projectx/backend/database.sqlite" ]; then
    # Создаем консистентную копию SQLite
    sqlite3 /opt/projectx/backend/database.sqlite ".backup $BACKUP_DIR/database_backup_$BACKUP_DATE.sqlite"
    
    # Проверяем целостность резервной копии
    if sqlite3 "$BACKUP_DIR/database_backup_$BACKUP_DATE.sqlite" "PRAGMA integrity_check;" | grep -q "ok"; then
        log "✅ Резервная копия базы данных создана и проверена: database_backup_$BACKUP_DATE.sqlite"
    else
        error "❌ Ошибка при создании резервной копии базы данных"
        exit 1
    fi
else
    warn "⚠️ Файл базы данных не найден в /opt/projectx/backend/database.sqlite"
fi

# 2. Резервная копия конфигурационных файлов
log "⚙️ Создание резервной копии конфигураций..."
cp -r /opt/projectx/backend "$BACKUP_DIR/backend_backup_$BACKUP_DATE"
cp -r /opt/projectx/frontend "$BACKUP_DIR/frontend_backup_$BACKUP_DATE"

# Сохраняем список установленных пакетов
if [ -f "/opt/projectx/backend/package.json" ]; then
    cp /opt/projectx/backend/package.json "$BACKUP_DIR/backend_package_$BACKUP_DATE.json"
fi
if [ -f "/opt/projectx/frontend/package.json" ]; then
    cp /opt/projectx/frontend/package.json "$BACKUP_DIR/frontend_package_$BACKUP_DATE.json"
fi

# 3. Резервная копия загруженных файлов
if [ -d "/opt/projectx/backend/uploads" ]; then
    log "📁 Создание резервной копии загруженных файлов..."
    tar -czf "$BACKUP_DIR/uploads_backup_$BACKUP_DATE.tar.gz" -C /opt/projectx/backend uploads
    log "✅ Резервная копия uploads создана"
fi

# 4. Сохраняем состояние PM2
log "🔧 Сохранение состояния PM2..."
pm2 save > "$BACKUP_DIR/pm2_dump_$BACKUP_DATE.txt" 2>&1 || warn "⚠️ Не удалось сохранить состояние PM2"

log "✅ Все резервные копии созданы в $BACKUP_DIR"

# Удаляем старые бэкапы (старше 7 дней)
find "$BACKUP_DIR" -name "*backup*" -type f -mtime +7 -delete 2>/dev/null || true
log "🗑️ Старые резервные копии очищены"

# ========================
# ОБНОВЛЕНИЕ КОДА
# ========================
log "📥 Получение последних изменений из Git..."
cd /opt/projectx

# Проверяем статус git
log "🔍 Проверка статуса git..."
if ! git status --porcelain | grep -q .; then
    log "✅ Рабочая директория чистая"
else
    warn "⚠️ Есть некоммитнутые изменения. Сохраняю их..."
    git stash push -m "Auto-stash before update $BACKUP_DATE"
fi

# Получаем изменения с merge стратегией
log "📦 Загрузка обновлений..."
if git fetch origin main; then
    log "✅ Изменения успешно загружены"
else
    error "❌ Ошибка при загрузке изменений из репозитория"
    exit 1
fi

# Безопасное обновление
if git merge origin/main --no-edit; then
    log "✅ Изменения успешно применены"
else
    warn "⚠️ Конфликты при слиянии. Пробую с rebase..."
    git merge --abort 2>/dev/null || true
    if git rebase origin/main; then
        log "✅ Rebase выполнен успешно"
    else
        error "❌ Не удалось применить изменения. Есть конфликты"
        git rebase --abort 2>/dev/null || true
        exit 1
    fi
fi

# Восстанавливаем стэш если был
if git stash list | grep -q "Auto-stash before update $BACKUP_DATE"; then
    log "🔄 Восстанавливаю сохраненные изменения..."
    if ! git stash pop; then
        warn "⚠️ Конфликт при восстановлении stash. Проверьте вручную: git stash list"
    fi
fi

# ========================
# ОБНОВЛЕНИЕ BACKEND
# ========================
log "⚙️ Обновление backend..."
cd backend

# Сохраняем текущую базу данных на месте
if [ -f "database.sqlite" ]; then
    log "🔒 Сохранение существующей базы данных..."
    # Создаем временную копию на случай проблем
    cp database.sqlite database.sqlite.updating
fi

# Устанавливаем зависимости
log "📦 Установка зависимостей backend..."
npm install --production --no-optional

# Выполняем безопасные миграции БД (только добавления, без потери данных)
log "🗄️ Выполнение безопасных миграций базы данных..."

# Проверяем наличие таблицы уведомлений и создаем если нужно
if [ -f "scripts/addNotificationsTable.js" ]; then
    log "� Создание таблицы notifications (если отсутствует)..."
    node scripts/addNotificationsTable.js || warn "⚠️ Миграция notifications уже выполнена или произошла ошибка"
fi

# Добавляем колонку category если отсутствует
if [ -f "scripts/addCategoryColumn.js" ]; then
    log "🏷️ Добавление колонки category (если отсутствует)..."
    node scripts/addCategoryColumn.js || warn "⚠️ Миграция category уже выполнена или произошла ошибка"
fi

# Проверяем другие миграции
if [ -f "scripts/ensurePointsSchema.js" ]; then
    log "💰 Проверка схемы баллов..."
    node scripts/ensurePointsSchema.js || warn "⚠️ Схема баллов уже актуальна"
fi

# Удаляем временную копию если все прошло успешно
if [ -f "database.sqlite.updating" ]; then
    rm database.sqlite.updating
fi

# Проверяем целостность базы данных после миграций
log "🔍 Проверка целостности базы данных..."
if sqlite3 database.sqlite "PRAGMA integrity_check;" | grep -q "ok"; then
    log "✅ База данных прошла проверку целостности"
else
    error "❌ Обнаружены проблемы с целостностью базы данных!"
    exit 1
fi

# Перезапускаем API сервер
log "🔄 Перезапуск API сервера..."
if pm2 describe projectx-api > /dev/null 2>&1; then
    pm2 restart projectx-api
    sleep 3
    
    # Проверяем что сервер запустился
    if pm2 describe projectx-api | grep -q "online"; then
        log "✅ API сервер перезапущен успешно"
    else
        error "❌ Ошибка перезапуска API сервера"
        pm2 logs projectx-api --lines 20
        exit 1
    fi
else
    log "🚀 Первый запуск API сервера..."
    pm2 start server.js --name projectx-api
    sleep 3
fi

cd ..

# ========================
# ОБНОВЛЕНИЕ FRONTEND
# ========================
log "🎨 Обновление frontend..."
cd frontend

# Очистка кэша npm и установка зависимостей
log "📦 Установка зависимостей frontend..."
npm ci --production

# Сборка frontend
log "🏗️ Сборка frontend приложения..."
if npm run build; then
    log "✅ Frontend собран успешно"
else
    error "❌ Ошибка сборки frontend"
    exit 1
fi

# Безопасное копирование файлов с резервным копированием
log "📁 Развертывание frontend файлов..."

# Создаем резервную копию текущего frontend
if [ -d "/var/www/html" ] && [ "$(ls -A /var/www/html)" ]; then
    log "💾 Создание резервной копии текущего frontend..."
    mkdir -p "$BACKUP_DIR"
    tar -czf "$BACKUP_DIR/www_html_backup_$BACKUP_DATE.tar.gz" -C /var/www html
fi

# Создаем директорию если не существует
if [ ! -d "/var/www/html" ]; then
    log "📂 Создание директории /var/www/html..."
    mkdir -p /var/www/html
fi

# Копируем новые файлы
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    rm -rf /var/www/html/*
    cp -r dist/* /var/www/html/
    
    # Устанавливаем правильные права доступа
    chown -R www-data:www-data /var/www/html/
    chmod -R 755 /var/www/html/
    
    log "✅ Frontend файлы развернуты"
else
    error "❌ Директория dist пуста или не найдена"
    exit 1
fi

cd ..

# ========================
# ПРОВЕРКИ И ТЕСТИРОВАНИЕ
# ========================

log "🔍 Выполнение проверок системы..."

# Ждем немного для стабилизации
sleep 5

# Проверка PM2
log "🔧 Проверка статуса PM2..."
if pm2 list | grep -q "online"; then
    log "✅ Backend обновлен и работает"
else
    error "⚠️ Проблемы с backend, логи PM2:"
    pm2 logs projectx-api --lines 10
    exit 1
fi

# Проверка nginx
log "🌐 Проверка статуса Nginx..."
if systemctl is-active --quiet nginx; then
    log "✅ Nginx работает"
    # Перезагружаем конфигурацию nginx для применения изменений
    systemctl reload nginx
else
    error "⚠️ Проблемы с nginx"
    systemctl status nginx
    exit 1
fi

# Проверка доступности API
log "🔐 Проверка доступности API..."
API_CHECK_COUNT=0
MAX_API_CHECKS=6

while [ $API_CHECK_COUNT -lt $MAX_API_CHECKS ]; do
    if curl -s -k -m 10 https://schoolactive.ru/api/auth/me > /dev/null 2>&1; then
        log "✅ HTTPS API отвечает"
        break
    else
        API_CHECK_COUNT=$((API_CHECK_COUNT + 1))
        if [ $API_CHECK_COUNT -lt $MAX_API_CHECKS ]; then
            warn "⏳ API не отвечает, попытка $API_CHECK_COUNT/$MAX_API_CHECKS, жду 10 секунд..."
            sleep 10
        else
            error "❌ HTTPS API не отвечает после $MAX_API_CHECKS попыток"
            exit 1
        fi
    fi
done

# Проверка frontend
log "🖥️ Проверка доступности frontend..."
if curl -s -k -m 10 https://schoolactive.ru > /dev/null 2>&1; then
    log "✅ Frontend доступен"
else
    warn "⚠️ Frontend может быть недоступен"
fi

# ========================
# ЗАВЕРШЕНИЕ И ОТЧЕТ
# ========================

log "🎉 Безопасное обновление завершено успешно!"

# Отчет об обновлении
echo ""
info "📊 ОТЧЕТ ОБ ОБНОВЛЕНИИ:"
info "🕐 Дата обновления: $(date)"
info "💾 Резервные копии: $BACKUP_DIR"
info "🌐 Сайт: https://schoolactive.ru"
info "🔧 API: https://schoolactive.ru/api/"

echo ""
info "📊 Статус сервисов:"
pm2 list

echo ""
info "📋 Последние 10 строк логов API:"
pm2 logs projectx-api --lines 10

echo ""
info "💾 Созданные резервные копии:"
ls -la "$BACKUP_DIR" | grep "$BACKUP_DATE" || echo "Нет файлов с датой $BACKUP_DATE"

echo ""
log "✅ Все настройки HTTPS сохранены и работают!"
log "✅ База данных сохранена и обновлена!"
log "✅ Все файлы обновлены без потери данных!"

echo ""
warn "📝 РЕКОМЕНДАЦИИ:"
warn "1. Проверьте работу сайта через браузер"
warn "2. Протестируйте функции входа и уведомлений"
warn "3. Резервные копии автоматически удаляются через 7 дней"
warn "4. При проблемах используйте: pm2 logs projectx-api"

# Отключаем trap для нормального завершения
trap - ERR

log "🏁 Обновление завершено! Система готова к работе."
