require('dotenv').config();

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';

let db;

if (DATABASE_TYPE === 'postgresql') {
  // PostgreSQL конфигурация
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'school_events',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  db = {
    type: 'postgresql',
    pool,
    query: (text, params) => pool.query(text, params)
  };

  console.log('🔗 Используется PostgreSQL база данных');

} else {
  // SQLite конфигурация (по умолчанию)
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');

  const dbPath = path.join(__dirname, '..', process.env.SQLITE_DATABASE || 'database.sqlite');

  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Ошибка подключения к SQLite:', err.message);
    } else {
      console.log('✅ Подключение к SQLite установлено');
    }
  });

  db = {
    type: 'sqlite',
    connection: sqliteDb,
    all: sqliteDb.all.bind(sqliteDb),
    get: sqliteDb.get.bind(sqliteDb),
    run: sqliteDb.run.bind(sqliteDb),
    serialize: sqliteDb.serialize.bind(sqliteDb)
  };

  console.log('🔗 Используется SQLite база данных');
}

module.exports = {
  db,
  DATABASE_TYPE
};