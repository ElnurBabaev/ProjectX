const db = require('../config/database-sqlite');

(async () => {
  try {
    console.log('Проверяю наличие колонки category в таблице events...');
    const info = await db.query("PRAGMA table_info('events')");
    const hasCategory = info.rows.some(r => r.name === 'category');
    if (hasCategory) {
      console.log('Колонка category уже существует.');
      process.exit(0);
    }

    console.log('Добавляю колонку category...');
    await db.query("ALTER TABLE events ADD COLUMN category TEXT");
    console.log('Готово. Колонка category добавлена.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка при добавлении колонки category:', err);
    process.exit(1);
  }
})();
