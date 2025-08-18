const db = require('./config/database');

async function testAdminAPI() {
  try {
    console.log('=== ТЕСТ API АДМИН-ПАНЕЛИ ===');
    
    // Эмулируем запрос GET /users
    const query = 'SELECT id, login, first_name, last_name, class_grade, class_letter, role, total_points as personalPoints, admin_points, created_at FROM users WHERE first_name = ? AND last_name = ?';
    const params = ['Мария', 'Петрова'];
    
    const result = await db.query(query, params);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('Результат API админ-панели для Марии Петровой:');
      console.log(JSON.stringify(user, null, 2));
      
      console.log('\nВажные поля:');
      console.log(`- personalPoints: ${user.personalPoints} (это то, что показывается в админ-панели)`);
      console.log(`- admin_points: ${user.admin_points}`);
      
    } else {
      console.log('Пользователь не найден');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

testAdminAPI();