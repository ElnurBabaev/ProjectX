const db = require('./config/database');

async function addAdminPointsField() {
  try {
    console.log('Добавляем поле admin_points в таблицу users...');
    
    // Добавляем поле для баллов от администратора
    await db.query('ALTER TABLE users ADD COLUMN admin_points INTEGER DEFAULT 0');
    console.log('Поле admin_points добавлено в таблицу users');
    
    // Проверяем новую структуру
    const result = await db.query('PRAGMA table_info(users)');
    console.log('\nОбновленная структура таблицы users:');
    result.rows.forEach(col => {
      console.log(`- ${col.name}: ${col.type}`);
    });
    
    process.exit(0);
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('Поле admin_points уже существует');
      process.exit(0);
    } else {
      console.error('Ошибка:', error);
      process.exit(1);
    }
  }
}

addAdminPointsField();