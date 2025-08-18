const db = require('./config/database');

async function testAdminUsersAPI() {
  try {
    console.log('=== ТЕСТ API ПОЛУЧЕНИЯ ПОЛЬЗОВАТЕЛЕЙ ===');
    
    // Эмулируем запрос GET /admin/users
    const query = 'SELECT id, login, first_name, last_name, class_grade, class_letter, role, total_points as personalPoints, admin_points, created_at FROM users ORDER BY created_at DESC LIMIT 3';
    
    const result = await db.query(query);
    
    console.log('Результат запроса к БД:');
    result.rows.forEach(user => {
      console.log(`${user.first_name} ${user.last_name}: personalPoints=${user.personalPoints}, admin_points=${user.admin_points}`);
    });
    
    // Показать структуру одного пользователя
    if (result.rows.length > 0) {
      console.log('\nПолная структура первого пользователя:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

testAdminUsersAPI();