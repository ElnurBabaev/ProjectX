const db = require('./config/database');

async function checkUsersTable() {
  try {
    const result = await db.query('PRAGMA table_info(users)');
    console.log('Структура таблицы users:');
    result.rows.forEach(col => {
      console.log(`- ${col.name}: ${col.type}`);
    });
    
    // Также проверим текущие значения total_points
    const usersResult = await db.query('SELECT id, first_name, last_name, total_points FROM users WHERE role = "student" ORDER BY total_points DESC');
    console.log('\nТекущие баллы пользователей:');
    usersResult.rows.forEach(user => {
      console.log(`${user.first_name} ${user.last_name}: ${user.total_points} баллов`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkUsersTable();