require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/SqliteUser');
const Event = require('./models/SqliteEvent');
const db = require('./config/sqliteDatabase');

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const achievementRoutes = require('./routes/achievements');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'Пользователь не найден' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};

// Connect routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'School Events API is running!',
    timestamp: new Date().toISOString()
  });
});

// Base API info endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'School Events Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      achievements: '/api/achievements',
      products: '/api/products',
      admin: '/api/admin'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Эндпоинт не найден' });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📋 API доступен по адресу: http://localhost:${PORT}/api`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('� Демо-аккаунты (логин/пароль):');
  console.log('   Администратор: admin / admin123');
  console.log('   Студент: ivanov / student123');
});

module.exports = app;