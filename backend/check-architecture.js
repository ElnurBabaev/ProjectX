#!/usr/bin/env node

require('dotenv').config();
const path = require('path');

console.log('🔍 АНАЛИЗ АРХИТЕКТУРЫ ПРОЕКТА');
console.log('=====================================');

// Проверка конфигурации
console.log('\n📋 КОНФИГУРАЦИЯ:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'не задано'}`);
console.log(`PORT: ${process.env.PORT || '5000'}`);
console.log(`DATABASE_TYPE: ${process.env.DATABASE_TYPE || 'postgresql'}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'установлен' : 'НЕ УСТАНОВЛЕН!'}`);
console.log(`DB_HOST: ${process.env.DB_HOST || 'не задано'}`);
console.log(`DB_PORT: ${process.env.DB_PORT || 'не задано'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'не задано'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'не задано'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'установлен' : 'НЕ УСТАНОВЛЕН!'}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'не задано'}`);

// Проверка структуры файлов
console.log('\n📁 СТРУКТУРА ПРОЕКТА:');

const fs = require('fs');

const checkFiles = [
  'server.js',
  'models/User.js',
  'models/Event.js',
  'models/Product.js', 
  'models/Achievement.js',
  'models/index.js',
  'routes/auth.js',
  'routes/events.js',
  'routes/products.js',
  'routes/achievements.js',
  'routes/admin.js',
  'middleware/auth.js',
  'config/database.js'
];

checkFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Проверка базы данных PostgreSQL
console.log('\n🗄️  ПРОВЕРКА БАЗЫ ДАННЫХ:');

async function checkPostgreSQL() {
  try {
    const { Pool } = require('pg');
    
    // Используем либо DATABASE_URL, либо отдельные параметры
    const config = process.env.DATABASE_URL ? 
      { connectionString: process.env.DATABASE_URL } : 
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      };
    
    if (process.env.NODE_ENV === 'production') {
      config.ssl = { rejectUnauthorized: false };
    }
    
    const pool = new Pool(config);

    // Проверяем подключение
    const client = await pool.connect();
    console.log('✅ Подключение к PostgreSQL установлено');
    
    // Проверяем таблицы
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('📊 Найденные таблицы:', tables.join(', '));
    
    // Проверяем количество записей в каждой таблице
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   📈 ${table}: ${countResult.rows[0].count} записей`);
      } catch (err) {
        console.log(`   ❌ Ошибка при подсчете записей в ${table}: ${err.message}`);
      }
    }
    
    client.release();
    await pool.end();
    
  } catch (err) {
    console.log('❌ Ошибка подключения к PostgreSQL:', err.message);
    console.log('💡 Проверьте настройки базы данных в .env файле');
    console.log('💡 Убедитесь, что PostgreSQL запущен и доступен');
  }
}

// Проверка зависимостей
console.log('\n📦 ЗАВИСИМОСТИ:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const deps = Object.keys(packageJson.dependencies || {});
  console.log('✅ Установленные пакеты:', deps.length);
  
  // Проверяем ключевые пакеты для PostgreSQL
  const requiredPackages = ['express', 'pg', 'bcryptjs', 'jsonwebtoken', 'cors'];
  requiredPackages.forEach(pkg => {
    console.log(`${deps.includes(pkg) ? '✅' : '❌'} ${pkg}`);
  });
} catch (e) {
  console.log('❌ Не удалось прочитать package.json');
}

console.log('\n🎯 РЕКОМЕНДАЦИИ:');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production-2024') {
  console.log('⚠️  Смените JWT_SECRET на production!');
}

if (!process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PASSWORD)) {
  console.log('⚠️  Настройте параметры подключения к PostgreSQL в .env файле!');
  console.log('💡 Убедитесь, что указаны DB_HOST, DB_NAME, DB_USER и DB_PASSWORD');
}

// Запускаем проверку PostgreSQL
checkPostgreSQL().then(() => {
  console.log('\n✨ Анализ завершен!');
}).catch(err => {
  console.log('\n❌ Ошибка при анализе базы данных:', err.message);
  console.log('\n✨ Анализ завершен с ошибками!');
});