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

async function initPostgreSQL() {
  try {
    console.log('🐘 ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ POSTGRESQL');
    console.log('=====================================');
    
    console.log(`📍 Подключение к базе: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    
    // Проверяем подключение
    await pool.query('SELECT NOW()');
    console.log('✅ Подключение к PostgreSQL успешно установлено');
    
    // Создание таблицы пользователей
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        class_grade INTEGER NOT NULL CHECK (class_grade BETWEEN 5 AND 11),
        class_letter CHAR(1) NOT NULL CHECK (class_letter IN ('А', 'Б', 'В', 'Г')),
        personal_points INTEGER DEFAULT 0,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица users создана или обновлена');

    // Создание таблицы мероприятий
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'other',
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        location VARCHAR(255),
        max_participants INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица events создана или обновлена');

    // Создание таблицы регистрации на мероприятия
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
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
    console.log('✅ Таблица event_registrations создана или обновлена');

    // Создание таблицы достижений
    await pool.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'points',
        requirement INTEGER,
        points_reward INTEGER DEFAULT 0,
        icon_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица achievements создана или обновлена');

    // Создание таблицы пользовательских достижений
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      )
    `);
    console.log('✅ Таблица user_achievements создана или обновлена');

    // Создание таблицы товаров
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        image_url VARCHAR(500),
        stock_quantity INTEGER DEFAULT 0,
        category VARCHAR(100),
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица products создана или обновлена');

    // Создание таблицы покупок
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        price_paid INTEGER NOT NULL,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица purchases создана или обновлена');

    // Создание индексов для оптимизации
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_login ON users(login)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_grade, class_letter)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id)');
    
    // Также создаём индексы для старых названий таблиц для совместимости
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id)');
    } catch (e) {
      // Таблица может не существовать, это нормально
    }
    
    console.log('✅ Индексы созданы');

    console.log('');
    console.log('🎉 База данных PostgreSQL успешно инициализирована!');
    console.log('📊 Все таблицы созданы и готовы к работе');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации PostgreSQL:', error.message);
    console.error('Полная ошибка:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  initPostgreSQL()
    .then(() => {
      console.log('✨ Инициализация завершена!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Фатальная ошибка:', err);
      process.exit(1);
    });
}

module.exports = initPostgreSQL;