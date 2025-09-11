const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к базе данных SQLite
const DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '../database.sqlite');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          // Включаем поддержку внешних ключей
          this.db.run('PRAGMA foreign_keys = ON');

          // Авто-проверка: если в таблице events нет колонки category, добавим её.
          try {
            this.db.all("PRAGMA table_info('events')", (err2, rows) => {
              if (err2) {
                console.error('Ошибка при проверке схемы events:', err2.message);
                resolve();
                return;
              }

              const hasCategory = Array.isArray(rows) && rows.some(r => r && r.name === 'category');
              if (!hasCategory) {
                console.log('Колонка category не найдена в events — пытаюсь добавить...');
                this.db.run("ALTER TABLE events ADD COLUMN category TEXT", (alterErr) => {
                  if (alterErr) {
                    console.error('Не удалось добавить колонку category:', alterErr.message);
                  } else {
                    console.log('Колонка category успешно добавлена в таблицу events');
                  }
                  resolve();
                });
              } else {
                resolve();
              }
            });
          } catch (ex) {
            console.error('Ошибка при авто-проверке schema events:', ex.message);
            resolve();
          }
        }
      });
    });
  }

  // Обертка для выполнения запросов с промисами
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      // Определяем тип запроса
      const sqlLower = sql.toLowerCase().trim();
      
      if (sqlLower.startsWith('select')) {
        // SELECT запросы возвращают все строки
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rows: rows || [] });
          }
        });
      } else if (sqlLower.startsWith('insert')) {
        // INSERT запросы возвращают информацию о вставке
        this.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              rows: [],
              insertId: this.lastID,
              affectedRows: this.changes
            });
          }
        });
      } else {
        // Другие запросы (UPDATE, DELETE, CREATE, etc.)
        this.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              rows: [],
              affectedRows: this.changes
            });
          }
        });
      }
    });
  }

  // Метод для получения одной строки
  async queryOne(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows[0] || null;
  }

  // Закрытие соединения
  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Получить экземпляр базы данных
  getDb() {
    return this.db;
  }
}

// Создаем единственный экземпляр базы данных
const database = new Database();

module.exports = database;