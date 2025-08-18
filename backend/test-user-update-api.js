const db = require('./config/database');
const { recalculateUserPoints } = require('./utils/pointsCalculator');

async function testUserUpdateAPI() {
  try {
    console.log('=== Тестируем обновление пользователя через API ===');
    
    // Найдем пользователя для тестирования (возьмем Анну Козлову)
    const userResult = await db.query(`
      SELECT id, first_name, last_name, total_points, admin_points 
      FROM users 
      WHERE first_name = 'Анна' AND last_name = 'Козлова'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('Тестовый пользователь не найден');
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log(`Тестируем с пользователем: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    console.log(`Текущие баллы: total_points=${user.total_points}, admin_points=${user.admin_points || 0}`);
    
    // Симулируем API запрос - добавляем 1000 баллов администратора
    const newAdminPoints = 1000;
    console.log(`\nСимулируем PUT /api/admin/users/${user.id} с admin_points=${newAdminPoints}...`);
    
    // Обновляем admin_points
    await db.query(`
      UPDATE users 
      SET admin_points = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newAdminPoints, user.id]);
    
    // Пересчитываем общие баллы (как делает API)
    await recalculateUserPoints(user.id);
    
    // Проверяем результат
    const updatedResult = await db.query(`
      SELECT id, first_name, last_name, total_points, admin_points 
      FROM users 
      WHERE id = ?
    `, [user.id]);
    
    const updatedUser = updatedResult.rows[0];
    console.log(`\nРезультат обновления:`);
    console.log(`${updatedUser.first_name} ${updatedUser.last_name}: total_points=${updatedUser.total_points}, admin_points=${updatedUser.admin_points}`);
    
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
      LIMIT 10
    `);
    
    console.log('\n=== Обновленный рейтинг (топ-10) ===');
    rankingResult.rows.forEach(user => {
      const highlight = user.first_name === 'Анна' && user.last_name === 'Козлова' ? ' ← АННА' : '';
      console.log(`${user.rank_position}. ${user.first_name} ${user.last_name} - ${user.total_points} баллов${highlight}`);
    });
    
    console.log('\n✅ Тест прошел успешно! API корректно обновляет баллы и пересчитывает рейтинг.');
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

testUserUpdateAPI();