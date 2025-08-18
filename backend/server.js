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
const uploadRoutes = require('./routes/upload');
const rankingRoutes = require('./routes/rankings');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || '127.0.0.1';

// Middleware безопасности
app.use(helmet());

// Ограничение запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000 // увеличиваем лимит для разработки
});
app.use('/api/', limiter);

// CORS
// Разрешённые источники можно задать через переменную окружения CORS_ORIGINS
// пример: CORS_ORIGINS="https://schoolactive.ru,https://www.schoolactive.ru,http://localhost:5173"
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'https://schoolactive.ru',
  'http://schoolactive.ru'
];
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(cors({
  origin(origin, callback) {
    // Разрешаем запросы без Origin (например, curl/health-check)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Статические файлы с CORS заголовками
const path = require('path');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(UPLOADS_DIR));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/rankings', rankingRoutes);

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
      admin: '/api/admin',
      rankings: '/api/rankings'
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
// Если приложение работает за обратным прокси (Nginx), включаем trust proxy
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📋 API доступен по адресу: http://${HOST}:${PORT}/api`);
  console.log(`🗄️ База данных: SQLite`);
  console.log(`🏠 Среда: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗂️ UPLOADS_DIR: ${UPLOADS_DIR}`);
  if (allowedOrigins.length) {
    console.log('🌐 CORS origins:', allowedOrigins.join(', '));
  }
});

server.on('error', (err) => {
  console.error('HTTP server error:', err.message);
});

module.exports = app;