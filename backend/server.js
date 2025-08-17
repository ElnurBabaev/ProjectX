require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const achievementRoutes = require('./routes/achievements');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware безопасности
app.use(helmet());

// Ограничение запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000 // увеличиваем лимит для разработки
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173'
  ],
  credentials: true
}));

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use('/uploads', express.static('uploads'));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'School Events API is running with SQLite!',
    timestamp: new Date().toISOString(),
    database: 'SQLite'
  });
});

// Базовый маршрут
app.get('/api', (req, res) => {
  res.json({ 
    message: 'School Events Management API (SQLite)',
    version: '1.0.0',
    database: 'SQLite',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      achievements: '/api/achievements',
      products: '/api/products',
      admin: '/api/admin'
    }
  });
});

// Обработка 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
  console.error('Глобальная ошибка:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Запуск сервера
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📋 API доступен по адресу: http://localhost:${PORT}/api`);
  console.log(`🗄️ База данных: SQLite`);
  console.log(`🏠 Среда: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
  console.error('HTTP server error:', err.message);
});

module.exports = app;