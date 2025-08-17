// Используем SQLite как основную базу данных
const database = require('./database-sqlite');

module.exports = {
  query: async (text, params) => {
    return await database.query(text, params);
  },
  database,
  // Для совместимости со старым кодом
  pool: database
};