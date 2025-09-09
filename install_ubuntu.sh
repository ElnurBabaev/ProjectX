#!/bin/bash

# 🚀 Скрипт установки зависимостей для ProjectX
# School Events Management System
# Система управления школьными мероприятиями
# Ubuntu 24.04.3 LTS

set -e  # Остановка при ошибке

echo "🏫 Добро пожаловать в установщик School Events Management System!"
echo "📋 Этот скрипт установит все необходимые зависимости для Ubuntu 24.04.3 LTS"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода статуса
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка прав администратора
if [[ $EUID -eq 0 ]]; then
   print_error "Не запускайте этот скрипт с правами root (sudo)!"
   print_warning "Скрипт сам запросит права администратора при необходимости."
   exit 1
fi

# Проверка версии Ubuntu
print_status "Проверка версии операционной системы..."
if ! lsb_release -d | grep -q "Ubuntu 24.04"; then
    print_warning "Этот скрипт оптимизирован для Ubuntu 24.04.3 LTS"
    print_warning "Ваша версия: $(lsb_release -d | cut -f2)"
    read -p "Продолжить установку? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Установка отменена пользователем"
        exit 1
    fi
fi

print_success "Версия ОС проверена"

# Обновление системы
print_status "Обновление списка пакетов..."
sudo apt update

print_status "Обновление системы (это может занять некоторое время)..."
sudo apt upgrade -y

# Установка базовых утилит
print_status "Установка базовых утилит..."
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    unzip \
    vim \
    nano

print_success "Базовые утилиты установлены"

# Проверка и установка Node.js
print_status "Проверка установки Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_warning "Node.js уже установлен: $NODE_VERSION"
    
    # Проверка версии Node.js
    NODE_MAJOR_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
        print_warning "Обнаружена устаревшая версия Node.js ($NODE_VERSION)"
        print_status "Обновление до последней LTS версии..."
        
        # Удаление старой версии
        sudo apt remove -y nodejs npm
        
        # Установка NodeSource репозитория
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt install -y nodejs
    else
        print_success "Node.js версии $NODE_VERSION подходит для проекта"
    fi
else
    print_status "Установка Node.js LTS..."
    
    # Установка NodeSource репозитория
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
    
    print_success "Node.js установлен: $(node --version)"
fi

# Проверка npm
if command -v npm &> /dev/null; then
    print_success "npm установлен: $(npm --version)"
else
    print_error "npm не найден. Переустановка Node.js..."
    sudo apt remove -y nodejs
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Обновление npm до последней версии
print_status "Обновление npm до последней версии..."
sudo npm install -g npm@latest

# Установка глобальных пакетов для разработки
print_status "Установка глобальных пакетов для разработки..."
sudo npm install -g \
    nodemon \
    pm2 \
    typescript \
    ts-node

print_success "Глобальные пакеты установлены"

# Установка Python (для некоторых npm пакетов)
print_status "Проверка Python..."
if command -v python3 &> /dev/null; then
    print_success "Python3 уже установлен: $(python3 --version)"
else
    print_status "Установка Python3..."
    sudo apt install -y python3 python3-pip python3-dev
fi

# Установка дополнительных библиотек для компиляции нативных модулей
print_status "Установка библиотек для компиляции нативных модулей..."
sudo apt install -y \
    make \
    g++ \
    libsqlite3-dev \
    libc6-dev \
    libstdc++6

print_success "Библиотеки для компиляции установлены"

# Проверка Git
if command -v git &> /dev/null; then
    print_success "Git уже установлен: $(git --version)"
else
    print_status "Установка Git..."
    sudo apt install -y git
fi

# Настройка Git (опционально)
if [ -z "$(git config --global user.name)" ]; then
    print_status "Настройка Git..."
    echo "Введите ваше имя для Git:"
    read -p "Имя: " git_name
    echo "Введите ваш email для Git:"
    read -p "Email: " git_email
    
    git config --global user.name "$git_name"
    git config --global user.email "$git_email"
    print_success "Git настроен"
fi

# Установка зависимостей проекта
PROJECT_DIR="/home/el/Рабочий стол/ProjectX"

if [ -d "$PROJECT_DIR" ]; then
    print_status "Переход в директорию проекта: $PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # Установка зависимостей бэкенда
    print_status "Установка зависимостей бэкенда..."
    if [ -d "backend" ]; then
        cd backend
        npm install
        print_success "Зависимости бэкенда установлены"
        
        # Инициализация базы данных
        print_status "Инициализация базы данных SQLite..."
        npm run init-db
        print_success "База данных инициализирована"
        
        cd ..
    else
        print_error "Папка backend не найдена!"
    fi
    
    # Установка зависимостей фронтенда
    print_status "Установка зависимостей фронтенда..."
    if [ -d "frontend" ]; then
        cd frontend
        npm install
        print_success "Зависимости фронтенда установлены"
        cd ..
    else
        print_error "Папка frontend не найдена!"
    fi
else
    print_error "Директория проекта не найдена: $PROJECT_DIR"
    print_warning "Убедитесь, что проект клонирован в правильную директорию"
fi

# Установка дополнительных инструментов разработки (опционально)
print_status "Хотите установить дополнительные инструменты разработки?"
echo "1. Visual Studio Code"
echo "2. Postman (для тестирования API)"
echo "3. Chrome/Chromium для разработки"
echo "4. Все вышеперечисленное"
echo "5. Пропустить"

read -p "Выберите опцию (1-5): " dev_tools_choice

case $dev_tools_choice in
    1|4)
        print_status "Установка Visual Studio Code..."
        wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
        sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
        sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
        sudo apt update
        sudo apt install -y code
        print_success "Visual Studio Code установлен"
        ;&
    2|4)
        print_status "Установка Postman..."
        sudo snap install postman
        print_success "Postman установлен"
        ;&
    3|4)
        print_status "Установка Chrome/Chromium..."
        sudo apt install -y chromium-browser
        print_success "Chromium установлен"
        ;;
    5)
        print_status "Пропуск установки дополнительных инструментов"
        ;;
    *)
        print_warning "Неверный выбор. Пропуск установки дополнительных инструментов"
        ;;
esac

# Создание скриптов быстрого запуска
print_status "Создание скриптов быстрого запуска..."

# Скрипт запуска бэкенда
cat > "$PROJECT_DIR/start_backend.sh" << 'EOF'
#!/bin/bash
echo "🚀 Запуск бэкенда School Events Management System..."
cd "$(dirname "$0")/backend"
npm start
EOF

# Скрипт запуска фронтенда
cat > "$PROJECT_DIR/start_frontend.sh" << 'EOF'
#!/bin/bash
echo "🌐 Запуск фронтенда School Events Management System..."
cd "$(dirname "$0")/frontend"
npm run dev
EOF

# Скрипт запуска в режиме разработки
cat > "$PROJECT_DIR/start_dev.sh" << 'EOF'
#!/bin/bash
echo "🔧 Запуск в режиме разработки..."
echo "Открываем 2 терминала: один для бэкенда, один для фронтенда"

# Функция для проверки установки терминала
check_terminal() {
    command -v "$1" >/dev/null 2>&1
}

# Поиск доступного терминала
if check_terminal gnome-terminal; then
    TERMINAL="gnome-terminal"
elif check_terminal xterm; then
    TERMINAL="xterm"
elif check_terminal konsole; then
    TERMINAL="konsole"
elif check_terminal xfce4-terminal; then
    TERMINAL="xfce4-terminal"
else
    echo "❌ Подходящий терминал не найден"
    echo "Запустите бэкенд и фронтенд вручную в отдельных терминалах:"
    echo "Терминал 1: cd backend && npm run dev"
    echo "Терминал 2: cd frontend && npm run dev"
    exit 1
fi

PROJECT_DIR="$(dirname "$0")"

# Запуск бэкенда в новом терминале
$TERMINAL --title="Backend - School Events" -- bash -c "cd '$PROJECT_DIR/backend' && echo '🚀 Запуск бэкенда...' && npm run dev; exec bash"

# Небольшая задержка
sleep 2

# Запуск фронтенда в новом терминале
$TERMINAL --title="Frontend - School Events" -- bash -c "cd '$PROJECT_DIR/frontend' && echo '🌐 Запуск фронтенда...' && npm run dev; exec bash"

echo "✅ Приложение запущено!"
echo "📱 Фронтенд: http://localhost:5173"
echo "🔧 Бэкенд: http://localhost:5000"
EOF

# Делаем скрипты исполняемыми
chmod +x "$PROJECT_DIR/start_backend.sh"
chmod +x "$PROJECT_DIR/start_frontend.sh"
chmod +x "$PROJECT_DIR/start_dev.sh"

print_success "Скрипты быстрого запуска созданы"

# Проверка установки
print_status "Проверка установки..."
echo ""
echo "🔍 Проверка версий установленного ПО:"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   Git: $(git --version)"
echo "   Python3: $(python3 --version 2>/dev/null || echo 'не установлен')"

# Финальная информация
echo ""
echo "🎉 УСТАНОВКА ЗАВЕРШЕНА УСПЕШНО! 🎉"
echo ""
print_success "Все зависимости установлены и готовы к использованию"
echo ""
echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
echo ""
echo "1. 🚀 Быстрый запуск (рекомендуется):"
echo "   ./start_dev.sh"
echo ""
echo "2. 📱 Ручной запуск:"
echo "   Терминал 1: cd backend && npm run dev"
echo "   Терминал 2: cd frontend && npm run dev"
echo ""
echo "3. 🌐 Доступ к приложению:"
echo "   Фронтенд: http://localhost:5173"
echo "   API бэкенд: http://localhost:5000"
echo ""
echo "4. 👤 Тестовые аккаунты:"
echo "   Администратор - Логин: admin, Пароль: admin123"
echo "   Студент - Логин: ivanov, Пароль: student123"
echo ""
echo "📚 Документация:"
echo "   - README.md - полная документация"
echo "   - QUICKSTART.md - быстрый старт"
echo "   - RUN_INSTRUCTIONS.md - инструкции по запуску"
echo ""
print_success "Готово! Приятной разработки! 🚀"
