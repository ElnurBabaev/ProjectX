const db = require('./config/database');

async function checkAllUsersAchievements() {
  try {
    // Проверяем всех пользователей с достижениями
    const usersWithAchievements = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.total_points as current_points,
        COALESCE(SUM(a.points), 0) as achievement_points,
        (SELECT COALESCE(SUM(e.points), 0) 
         FROM event_registrations er 
         JOIN events e ON er.event_id = e.id 
         WHERE er.user_id = u.id AND er.status IN ('attended', 'registered')) as event_points
      FROM users u
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      LEFT JOIN achievements a ON ua.achievement_id = a.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.first_name, u.last_name, u.total_points
      HAVING achievement_points > 0
      ORDER BY achievement_points DESC
    `);
    
    console.log('=== Пользователи с достижениями ===');
    usersWithAchievements.rows.forEach(user => {
      console.log(`${user.first_name} ${user.last_name}:`);
      console.log(`  - Текущие баллы в БД: ${user.current_points}`);
      console.log(`  - Баллы за достижения: ${user.achievement_points}`);
      console.log(`  - Баллы за мероприятия: ${user.event_points}`);
      console.log(`  - Общие баллы должны быть: ${user.achievement_points + user.event_points}`);
      console.log('');
    });
    
    const totalAchievementPoints = usersWithAchievements.rows.reduce((sum, user) => sum + user.achievement_points, 0);
    console.log(`Общие баллы за достижения у всех пользователей: ${totalAchievementPoints}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkAllUsersAchievements();