const db = require('./config/database');

async function debugUserDsad() {
  try {
    // Проверяем данные пользователя dsad sdasd
    const userResult = await db.query(`
      SELECT id, first_name, last_name, total_points 
      FROM users 
      WHERE first_name = 'dsad' AND last_name = 'sdasd'
    `);
    
    console.log('=== Данные пользователя dsad sdasd ===');
    console.log(userResult.rows[0]);
    
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      
      // Проверяем регистрации на мероприятия
      const registrationsResult = await db.query(`
        SELECT er.*, e.title, e.points, e.start_date
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        WHERE er.user_id = ?
        ORDER BY e.start_date DESC
      `, [userId]);
      
      console.log('\n=== Регистрации на мероприятия ===');
      registrationsResult.rows.forEach(reg => {
        console.log(`- ${reg.title}: ${reg.points} баллов, статус: ${reg.status}`);
      });
      
      // Пересчитаем баллы вручную
      const pointsCalcResult = await db.query(`
        SELECT COALESCE(SUM(e.points), 0) as calculated_points
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        WHERE er.user_id = ? AND er.status IN ('attended', 'registered')
      `, [userId]);
      
      console.log('\n=== Расчет баллов ===');
      console.log('Текущие баллы в БД:', userResult.rows[0].total_points);
      console.log('Рассчитанные баллы:', pointsCalcResult.rows[0].calculated_points);
      
      // Проверим достижения (возможно проблема в старых данных)
      const achievementsResult = await db.query(`
        SELECT ua.*, a.title, a.points
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = ?
      `, [userId]);
      
      console.log('\n=== Достижения пользователя ===');
      if (achievementsResult.rows.length > 0) {
        achievementsResult.rows.forEach(ach => {
          console.log(`- ${ach.title}: ${ach.points} баллов`);
        });
        
        const totalAchievementPoints = achievementsResult.rows.reduce((sum, ach) => sum + ach.points, 0);
        console.log('Общие баллы за достижения:', totalAchievementPoints);
      } else {
        console.log('Достижений нет');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

debugUserDsad();