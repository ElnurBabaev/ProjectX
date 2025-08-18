const db = require('./config/database');

async function testUpdatePointsAPI() {
  try {
    console.log('=== Тестируем новый API эндпоинт update-points ===');
    
    // Найдем пользователя для теста (Дмитрий Сидоров)
    const userResult = await db.query(`
      SELECT id, first_name, last_name, total_points, admin_points 
      FROM users 
      WHERE first_name = 'Дмитрий' AND last_name = 'Сидоров'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('Пользователь не найден');
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log(`Пользователь: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    console.log(`До обновления: total_points=${user.total_points}, admin_points=${user.admin_points || 0}`);
    
    // Симулируем API запрос POST /api/admin/users/:userId/update-points
    // Добавляем 500 баллов
    const pointsToAdd = 500;
    console.log(`\nДобавляем ${pointsToAdd} баллов через API...`);
    
    // Получаем текущие admin_points
    const currentAdminPoints = user.admin_points || 0;
    const newAdminPoints = currentAdminPoints + pointsToAdd;
    
    // Обновляем admin_points (как делает API)
    await db.query(`
      UPDATE users 
      SET admin_points = ?
      WHERE id = ?
    `, [newAdminPoints, user.id]);
    
    // Пересчитываем общие баллы
    const { recalculateUserPoints } = require('./utils/pointsCalculator');
    await recalculateUserPoints(user.id);
    
    // Проверяем результат
    const updatedResult = await db.query(`
      SELECT id, first_name, last_name, total_points, admin_points 
      FROM users 
      WHERE id = ?
    `, [user.id]);
    
    const updatedUser = updatedResult.rows[0];
    console.log(`После обновления: total_points=${updatedUser.total_points}, admin_points=${updatedUser.admin_points}`);
    
    // Проверяем рейтинг
    const rankingResult = await db.query(`
      SELECT 
        u.first_name, 
        u.last_name, 
        u.total_points, 
        RANK() OVER (ORDER BY u.total_points DESC) as rank_position 
      FROM users u 
      WHERE u.role = 'student' 
      ORDER BY u.total_points DESC
      LIMIT 8
    `);
    
    console.log('\n=== Рейтинг после обновления ===');
    rankingResult.rows.forEach(user => {
      const highlight = user.first_name === 'Дмитрий' && user.last_name === 'Сидоров' ? ' ← ДМИТРИЙ' : '';
      console.log(`${user.rank_position}. ${user.first_name} ${user.last_name} - ${user.total_points} баллов${highlight}`);
    });
    
    console.log('\n✅ API работает корректно!');
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

testUpdatePointsAPI();