const db = require('./config/database');

async function checkData() {
  try {
    console.log('Проверяем данные в базе...');
    
    // Проверяем количество пользователей
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    console.log('Пользователей:', users.rows[0].count);
    
    // Проверяем достижения пользователей
    const achievements = await db.query('SELECT COUNT(*) as count FROM user_achievements');
    console.log('Достижений у пользователей:', achievements.rows[0].count);
    
    // Проверяем регистрации на события
    const events = await db.query('SELECT COUNT(*) as count FROM event_registrations');
    console.log('Регистраций на события:', events.rows[0].count);
    
    // Показываем последние достижения
    const recent = await db.query(`
      SELECT ua.id, u.login, a.title, ua.awarded_at
      FROM user_achievements ua
      JOIN users u ON ua.user_id = u.id
      JOIN achievements a ON ua.achievement_id = a.id
      ORDER BY ua.awarded_at DESC
      LIMIT 3
    `);
    console.log('Последние достижения:', recent.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkData();