require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

app.use(express.json());

// Simple test endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

// Try to load auth routes safely
try {
  console.log('Loading auth routes...');
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

// Try to load other routes safely
const routesList = [
  { name: 'events', path: './routes/events' },
  { name: 'achievements', path: './routes/achievements' },
  { name: 'products', path: './routes/products' },
  { name: 'admin', path: './routes/admin' }
];

routesList.forEach(route => {
  try {
    console.log(`Loading ${route.name} routes...`);
    const routeModule = require(route.path);
    app.use(`/api/${route.name}`, routeModule);
    console.log(`✅ ${route.name} routes loaded`);
  } catch (error) {
    console.error(`❌ Error loading ${route.name} routes:`, error.message);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📋 API: http://localhost:${PORT}/api`);
  console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
});