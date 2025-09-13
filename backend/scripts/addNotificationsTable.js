const database = require('../config/database-sqlite');

async function migrateNotificationsTable() {
  try {
    console.log('🔧 Миграция таблицы notifications для добавления типа event_confirmed...');

    // Проверяем, существует ли таблица
    const tableExists = await database.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'
    `);

    if (tableExists.rows.length === 0) {
      console.log('Таблица notifications не существует, создаем новую...');
      return await addNotificationsTable();
    }

    // Создаем временную таблицу с новой схемой
    console.log('Создаем временную таблицу с новой схемой...');
    await database.query(`
      CREATE TABLE notifications_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('order_created', 'order_confirmed', 'order_cancelled', 'achievement_earned', 'event_confirmed', 'system')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER,
        is_read BOOLEAN DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Копируем данные из старой таблицы
    console.log('Копируем данные из старой таблицы...');
    await database.query(`
      INSERT INTO notifications_temp (id, user_id, type, title, message, related_id, is_read, created_at)
      SELECT id, user_id, type, title, message, related_id, is_read, created_at
      FROM notifications
    `);

    // Удаляем старую таблицу
    console.log('Удаляем старую таблицу...');
    await database.query('DROP TABLE notifications');

    // Переименовываем новую таблицу
    console.log('Переименовываем новую таблицу...');
    await database.query('ALTER TABLE notifications_temp RENAME TO notifications');

    // Восстанавливаем индексы
    console.log('Восстанавливаем индексы...');
    await database.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await database.query('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');

    console.log('✅ Миграция таблицы notifications завершена успешно');

  } catch (error) {
    console.error('❌ Ошибка при миграции таблицы notifications:', error);
    throw error;
  }
}

async function addNotificationsTable() {
  try {
    console.log('🔧 Создание таблицы notifications...');

    // Создание таблицы уведомлений (если не существует)
    await database.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('order_created', 'order_confirmed', 'order_cancelled', 'achievement_earned', 'event_confirmed', 'system')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER, -- ID связанного объекта (заказ, достижение и т.д.)
        is_read BOOLEAN DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание индексов для таблицы notifications (если не существуют)
    await database.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await database.query('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');

    console.log('✅ Таблица notifications создана успешно');

  } catch (error) {
    console.error('❌ Ошибка при создании таблицы notifications:', error);
    throw error;
  }
}

// Запуск миграции
if (require.main === module) {
  migrateNotificationsTable()
    .then(() => {
      console.log('🎉 Миграция завершена успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Критическая ошибка миграции:', error);
      process.exit(1);
    });
}

module.exports = { addNotificationsTable, migrateNotificationsTable };