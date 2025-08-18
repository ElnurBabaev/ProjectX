const db = require('./config/database');
const { recalculateUserPoints } = require('./utils/pointsCalculator');

async function checkMariaPoints() {
  try {
    console.log('=== Проверка баллов Марии Петровой ===');
    
    // Найдем пользователя Мария Петрова
    const userResult = await db.query(`
      SELECT id, first_name, last_name, total_points, admin_points 
      FROM users 
      WHERE first_name = 'Мария' AND last_name = 'Петрова'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('Пользователь Мария Петрова не найден');
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log(`Найден пользователь: ID ${user.id}, ${user.first_name} ${user.last_name}`);
    console.log(`Текущие баллы: ${user.total_points}, admin_points: ${user.admin_points || 0}`);
    
    // Проверим детальную разбивку баллов
    const eventsResult = await db.query(`
      SELECT COALESCE(SUM(e.points), 0) as event_points
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.user_id = ? AND er.status IN ('attended', 'registered')
    `, [user.id]);

    const achievementsResult = await db.query(`
      SELECT COALESCE(SUM(a.points), 0) as achievement_points
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
    `, [user.id]);
    
    console.log('\nДетальная разбивка баллов:');
    console.log(`- Мероприятия: ${eventsResult.rows[0].event_points}`);
    console.log(`- Достижения: ${achievementsResult.rows[0].achievement_points}`);
    console.log(`- Администратор: ${user.admin_points || 0}`);
    console.log(`- Должно быть общих: ${eventsResult.rows[0].event_points + achievementsResult.rows[0].achievement_points + (user.admin_points || 0)}`);
    
    // Принудительно пересчитаем баллы
    console.log('\nПринудительно пересчитываем баллы...');
    await recalculateUserPoints(user.id);
    
    // Проверим результат
    const updatedResult = await db.query(`
      SELECT id, first_name, last_name, total_points, admin_points 
      FROM users 
      WHERE id = ?
    `, [user.id]);
    
    const updatedUser = updatedResult.rows[0];
    console.log(`\nПосле пересчета: ${updatedUser.total_points} общих баллов`);
    
    // Проверим рейтинг
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
    
    console.log('\n=== Текущий рейтинг (топ-10) ===');
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

checkMariaPoints();