const db = require('./config/database.js');

async function checkDatabase() {
  try {
    console.log('🔍 Проверяем структуру базы данных...\n');
    
    // Проверяем структуру таблицы users
    const tableInfo = await db.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
    console.log('📋 Структура таблицы users:');
    console.log(tableInfo.rows[0]?.sql || 'Таблица не найдена');
    
    // Проверяем существующих пользователей с avatar_url
    const users = await db.query("SELECT id, login, avatar_url FROM users LIMIT 5");
    console.log('\n👥 Первые 5 пользователей:');
    users.rows.forEach(user => {
      console.log(`ID: ${user.id}, Login: ${user.login}, Avatar: ${user.avatar_url || 'нет'}`);
    });
    
    // Проверяем администратора
    const admin = await db.query("SELECT * FROM users WHERE login = 'admin'");
    console.log('\n👑 Администратор:');
    if (admin.rows.length > 0) {
      const adminUser = admin.rows[0];
      console.log(`ID: ${adminUser.id}`);
      console.log(`Login: ${adminUser.login}`);
      console.log(`Avatar URL: ${adminUser.avatar_url || 'нет'}`);
      console.log(`Role: ${adminUser.role}`);
    } else {
      console.log('Администратор не найден');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
  
  process.exit(0);
}

checkDatabase();