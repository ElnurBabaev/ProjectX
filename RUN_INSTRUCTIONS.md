# 🚀 Инструкция по запуску приложения локально

## 📋 Предварительные требования

1. **Node.js** (версия 16 или выше)
   - Скачайте с официального сайта: https://nodejs.org/
   - Или используйте менеджер версий: `nvm` или `fnm`

2. **npm** или **yarn** (поставляется с Node.js)

## 🛠️ Установка и запуск

### 1. Backend (API сервер)

```bash
# Переходим в папку backend
cd backend

# Устанавливаем зависимости
npm install

# Инициализируем базу данных
npm run init-db

# Запускаем сервер
npm start
# или для разработки с автоперезагрузкой:
npm run dev
```

Backend будет доступен по адресу: `http://localhost:5000`

### 2. Frontend (Веб-интерфейс)

Откройте новый терминал:

```bash
# Переходим в папку frontend
cd frontend

# Устанавливаем зависимости
npm install

# Запускаем frontend
npm run dev
```

Frontend будет доступен по адресу: `http://localhost:5173`

## 🗃️ База данных

Проект использует SQLite:
- Файл БД: `backend/database.sqlite`
- Инициализация: `npm run init-db` в папке backend
- Создание админа: запустите `node scripts/createAdmin.js`

## 🔑 Доступ администратора

После инициализации БД:
- **Логин:** admin
- **Пароль:** admin123

Для сброса пароля админа: `node update-admin-password.js`

## 🌐 API Endpoints

- Base URL: `http://localhost:5000/api`
- Документация: см. файлы в `routes/`

## 🔧 Полезные скрипты

В папке backend:
- `node recalculate-all.js` - пересчет всех баллов
- `node scripts/createStudent.js` - создание тестового студента
- `node scripts/addTestAchievements.js` - добавление тестовых достижений

## 🚨 Возможные проблемы

1. **Порт занят**: измените PORT в .env файле
2. **CORS ошибки**: проверьте CORS_ORIGINS в .env
3. **База данных**: удалите database.sqlite и пересоздайте
