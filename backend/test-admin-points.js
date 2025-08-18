// Тестируем добавление баллов администратором пользователю dsad sdasd (ID: 5)
const db = require('./config/database');
const { recalculateUserPoints } = require('./utils/pointsCalculator');

async function testAdminPoints() {
  try {
    console.log('=== ТЕСТ: Добавление баллов администратором ===');
    
    // Проверяем текущие баллы пользователя dsad sdasd (ID: 5)
    const beforeResult = await db.query(`
      SELECT id, first_name, last_name, total_points, admin_points 
      FROM users 
      WHERE id = 5
    `);
    
    console.log('ДО добавления баллов:');
    console.log(`${beforeResult.rows[0].first_name} ${beforeResult.rows[0].last_name}: ${beforeResult.rows[0].total_points} общих баллов (admin_points: ${beforeResult.rows[0].admin_points || 0})`);
    
    // Добавляем 9905 баллов администратором (чтобы получить 10055 общих)
    const targetAdminPoints = 9905; // 10055 - 150 = 9905
    await db.query(`
      UPDATE users 
      SET admin_points = ?
      WHERE id = 5
    `, [targetAdminPoints]);
    
    // Пересчитываем общие баллы
    await recalculateUserPoints(5);
    
    // Проверяем результат
    const afterResult = await db.query(`
      SELECT id, first_name, last_name, total_points, admin_points 
      FROM users 
      WHERE id = 5
    `);
    
    console.log('\nПОСЛЕ добавления баллов:');
    console.log(`${afterResult.rows[0].first_name} ${afterResult.rows[0].last_name}: ${afterResult.rows[0].total_points} общих баллов (admin_points: ${afterResult.rows[0].admin_points || 0})`);
    
    console.log('\n=== Проверяем новый рейтинг ===');
    const rankingResult = await db.query(`
      SELECT 
        u.first_name, 
        u.last_name, 
        u.total_points, 
        RANK() OVER (ORDER BY u.total_points DESC) as rank_position 
      FROM users u 
      WHERE u.role = 'student' 
      ORDER BY u.total_points DESC
      LIMIT 5
    `);
    
    console.log('Топ-5 рейтинга:');
    rankingResult.rows.forEach(user => {
      console.log(`${user.rank_position}. ${user.first_name} ${user.last_name} - ${user.total_points} баллов`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

testAdminPoints();