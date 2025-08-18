const db = require('./config/database');

async function checkUserData() {
  try {
    console.log('Проверяем данные для пользователя elnur1 (id: 11)...');
    
    // Проверяем данные пользователя
    const user = await db.query('SELECT * FROM users WHERE id = 11');
    console.log('Пользователь elnur1:', user.rows[0]);
    
    // Его достижения
    const achievements = await db.query(`
      SELECT a.title, a.points, ua.awarded_at 
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = 11
      ORDER BY ua.awarded_at DESC
    `);
    console.log('Достижения elnur1:', achievements.rows);
    
    // Его участие в событиях  
    const events = await db.query(`
      SELECT e.title, e.points, er.registered_at, er.status
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id  
      WHERE er.user_id = 11
      ORDER BY er.registered_at DESC
    `);
    console.log('События elnur1:', events.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkUserData();