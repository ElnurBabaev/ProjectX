const db = require('./config/database');

async function debugMariaData() {
  try {
    console.log('=== ДЕТАЛЬНАЯ ПРОВЕРКА МАРИИ ПЕТРОВОЙ ===');
    
    // Проверяем все данные Марии Петровой
    const userResult = await db.query(`
      SELECT id, first_name, last_name, total_points, admin_points, created_at
      FROM users 
      WHERE first_name = 'Мария' AND last_name = 'Петрова'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('Пользователь Мария Петрова не найден');
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log(`Найден пользователь: ID ${user.id}`);
    console.log(`- Имя: ${user.first_name} ${user.last_name}`);
    console.log(`- total_points: ${user.total_points}`);
    console.log(`- admin_points: ${user.admin_points || 0}`);
    console.log(`- created_at: ${user.created_at}`);
    
    // Проверяем, что возвращает API для админ-панели
    console.log('\n=== ДАННЫЕ ИЗ API АДМИН-ПАНЕЛИ ===');
    const adminApiResult = await db.query(`
      SELECT 
        id, login, first_name, last_name, class_grade, class_letter, role, 
        total_points as personalPoints, admin_points, created_at 
      FROM users 
      WHERE first_name = 'Мария' AND last_name = 'Петрова'
    `);
    
    const adminData = adminApiResult.rows[0];
    console.log(`API админ-панели возвращает:`);
    console.log(`- personalPoints: ${adminData.personalPoints}`);
    console.log(`- admin_points: ${adminData.admin_points}`);
    
    // Проверяем детальную разбивку баллов
    console.log('\n=== ДЕТАЛЬНАЯ РАЗБИВКА БАЛЛОВ ===');
    
    // Баллы за мероприятия
    const eventsResult = await db.query(`
      SELECT COALESCE(SUM(e.points), 0) as event_points
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.user_id = ? AND er.status IN ('attended', 'registered')
    `, [user.id]);
    
    // Баллы за достижения
    const achievementsResult = await db.query(`
      SELECT COALESCE(SUM(a.points), 0) as achievement_points
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
    `, [user.id]);
    
    const eventPoints = eventsResult.rows[0].event_points;
    const achievementPoints = achievementsResult.rows[0].achievement_points;
    const adminPoints = user.admin_points || 0;
    const calculatedTotal = eventPoints + achievementPoints + adminPoints;
    
    console.log(`Мероприятия: ${eventPoints}`);
    console.log(`Достижения: ${achievementPoints}`);
    console.log(`Администратор: ${adminPoints}`);
    console.log(`Рассчитанные общие: ${calculatedTotal}`);
    console.log(`Фактические в БД: ${user.total_points}`);
    
    if (calculatedTotal !== user.total_points) {
      console.log('\n❌ ПРОБЛЕМА: Рассчитанные и фактические баллы не совпадают!');
      console.log('Пересчитываем баллы...');
      
      const { recalculateUserPoints } = require('./utils/pointsCalculator');
      await recalculateUserPoints(user.id);
      
      // Проверяем снова
      const updatedResult = await db.query(`
        SELECT total_points FROM users WHERE id = ?
      `, [user.id]);
      
      console.log(`После пересчета: ${updatedResult.rows[0].total_points}`);
    } else {
      console.log('\n✅ Баллы рассчитаны правильно');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

debugMariaData();