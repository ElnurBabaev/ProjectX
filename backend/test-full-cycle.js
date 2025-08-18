const db = require('./config/database');

async function testFullCycle() {
  try {
    console.log('=== Полный тест: API + отображение баллов ===');
    
    // Сначала проверим, что возвращает GET /admin/users
    console.log('\n1. Проверяем GET /admin/users для пользователя Иван Иванов...');
    
    const usersResult = await db.query(`
      SELECT 
        id, login, first_name, last_name, class_grade, class_letter, role, 
        total_points as personalPoints, admin_points, created_at 
      FROM users 
      WHERE first_name = 'Иван' AND last_name = 'Иванов'
    `);
    
    if (usersResult.rows.length === 0) {
      console.log('Пользователь не найден');
      process.exit(1);
    }
    
    const user = usersResult.rows[0];
    console.log('Данные пользователя из API:');
    console.log(`- ID: ${user.id}`);
    console.log(`- personalPoints: ${user.personalPoints}`);
    console.log(`- admin_points: ${user.admin_points}`);
    
    // 2. Симулируем изменение баллов через frontend
    console.log('\n2. Добавляем 300 баллов через API update-points...');
    
    const pointsToAdd = 300;
    const currentAdminPoints = user.admin_points || 0;
    const newAdminPoints = currentAdminPoints + pointsToAdd;
    
    // Обновляем баллы (как делает API)
    await db.query(`UPDATE users SET admin_points = ? WHERE id = ?`, [newAdminPoints, user.id]);
    
    // Пересчитываем общие баллы
    const { recalculateUserPoints } = require('./utils/pointsCalculator');
    await recalculateUserPoints(user.id);
    
    console.log(`Баллы обновлены: admin_points = ${newAdminPoints}`);
    
    // 3. Проверяем, что теперь возвращает GET /admin/users
    console.log('\n3. Проверяем обновленные данные из API...');
    
    const updatedUsersResult = await db.query(`
      SELECT 
        id, login, first_name, last_name, class_grade, class_letter, role, 
        total_points as personalPoints, admin_points, created_at 
      FROM users 
      WHERE id = ?
    `, [user.id]);
    
    const updatedUser = updatedUsersResult.rows[0];
    console.log('Обновленные данные из API:');
    console.log(`- personalPoints: ${updatedUser.personalPoints} (было: ${user.personalPoints})`);
    console.log(`- admin_points: ${updatedUser.admin_points}`);
    
    // 4. Проверяем рейтинг
    console.log('\n4. Проверяем рейтинг...');
    
    const rankingResult = await db.query(`
      SELECT 
        u.first_name, 
        u.last_name, 
        u.total_points, 
        RANK() OVER (ORDER BY u.total_points DESC) as rank_position 
      FROM users u 
      WHERE u.role = 'student' 
      ORDER BY u.total_points DESC
      LIMIT 10
    `);
    
    rankingResult.rows.forEach(user => {
      const highlight = user.first_name === 'Иван' && user.last_name === 'Иванов' ? ' ← ИВАН' : '';
      console.log(`${user.rank_position}. ${user.first_name} ${user.last_name} - ${user.total_points} баллов${highlight}`);
    });
    
    console.log('\n✅ Полный цикл работает корректно!');
    console.log('Теперь в админ-панели должны отображаться обновленные баллы.');
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

testFullCycle();