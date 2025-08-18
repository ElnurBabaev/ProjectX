const db = require('./config/database');
const { recalculateUserPoints } = require('./utils/pointsCalculator');

async function addPointsToMaria() {
  try {
    console.log('Добавляем 5000 баллов Марии Петровой...');
    
    // Находим пользователя
    const userResult = await db.query(`
      SELECT id, first_name, last_name 
      FROM users 
      WHERE first_name = 'Мария' AND last_name = 'Петрова'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('Пользователь не найден');
      process.exit(1);
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Найден пользователь: ${userResult.rows[0].first_name} ${userResult.rows[0].last_name} (ID: ${userId})`);
    
    // Добавляем 5000 баллов
    await db.query(`
      UPDATE users 
      SET admin_points = 5000
      WHERE id = ?
    `, [userId]);
    
    console.log('Баллы добавлены в поле admin_points');
    
    // Пересчитываем общие баллы
    await recalculateUserPoints(userId);
    
    // Проверяем результат
    const checkResult = await db.query(`
      SELECT first_name, last_name, total_points, admin_points
      FROM users 
      WHERE id = ?
    `, [userId]);
    
    const user = checkResult.rows[0];
    console.log(`Результат: ${user.first_name} ${user.last_name} теперь имеет ${user.total_points} общих баллов (admin_points: ${user.admin_points})`);
    
    // Проверяем новый рейтинг
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
    
    console.log('\n=== Новый рейтинг (топ-5) ===');
    rankingResult.rows.forEach(user => {
      const highlight = user.first_name === 'Мария' && user.last_name === 'Петрова' ? ' ← МАРИЯ' : '';
      console.log(`${user.rank_position}. ${user.first_name} ${user.last_name} - ${user.total_points} баллов${highlight}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

addPointsToMaria();