#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrateDatabase() {
  try {
    console.log('🔧 МИГРАЦИЯ БАЗЫ ДАННЫХ POSTGRESQL');
    console.log('==================================');
    
    // Добавляем недостающие поля в таблицу events
    try {
      await pool.query('ALTER TABLE events ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE');
      console.log('✅ Поле is_active добавлено в events');
    } catch (error) {
      console.log('⚠️ Поле is_active уже существует в events');
    }
    
    try {
      await pool.query('ALTER TABLE events RENAME COLUMN date TO start_date');
      console.log('✅ Поле date переименовано в start_date в events');
    } catch (error) {
      console.log('⚠️ Поле start_date уже существует в events');
    }
    
    // Добавляем недостающие поля в таблицу products
    try {
      await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE');
      console.log('✅ Поле is_available добавлено в products');
    } catch (error) {
      console.log('⚠️ Поле is_available уже существует в products');
    }
    
    try {
      await pool.query('ALTER TABLE products RENAME COLUMN name TO title');
      console.log('✅ Поле name переименовано в title в products');
    } catch (error) {
      console.log('⚠️ Поле title уже существует в products');
    }
    
    // Создаём таблицу event_participants если она отсутствует (для совместимости со старыми скриптами)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS event_participants (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
          registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) DEFAULT 'registered',
          points_awarded INTEGER DEFAULT 0,
          confirmed_at TIMESTAMP,
          UNIQUE(user_id, event_id)
        )
      `);
      console.log('✅ Таблица event_participants создана для совместимости');
    } catch (error) {
      console.log('⚠️ Таблица event_participants уже существует');
    }
    
    console.log('');
    console.log('🎉 Миграция базы данных завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка миграции PostgreSQL:', error.message);
    console.error('Полная ошибка:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('✨ Миграция завершена!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Фатальная ошибка:', err);
      process.exit(1);
    });
}

module.exports = migrateDatabase;