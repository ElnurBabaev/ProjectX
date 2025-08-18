const database = require('../config/database-sqlite');

async function checkUsers() {
  try {
    console.log('📋 Проверка пользователей в базе данных...\n');

    // Получаем всех пользователей
    const users = await database.query(`
      SELECT id, login, first_name, last_name, class_grade, class_letter, role 
      FROM users 
      ORDER BY role DESC, last_name
    `);

    console.log('=== ПОЛЬЗОВАТЕЛИ В БАЗЕ ДАННЫХ ===');
    console.log('ID | Логин      | ФИО                | Класс | Роль');
    console.log('-'.repeat(60));
    
    users.rows.forEach(user => {
      const name = `${user.first_name} ${user.last_name}`.padEnd(18);
      const login = user.login.padEnd(10);
      const classInfo = `${user.class_grade}${user.class_letter}`.padEnd(5);
      console.log(`${user.id}  | ${login} | ${name} | ${classInfo} | ${user.role}`);
    });

    // Получаем статистику по достижениям
    const achievementStats = await database.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        COUNT(CASE WHEN ua.achievement_id IS NOT NULL THEN 1 END) as achievements_count,
        COALESCE(SUM(a.points), 0) as total_points
      FROM users u
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      LEFT JOIN achievements a ON ua.achievement_id = a.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total_points DESC
    `);

    console.log('\n=== СТАТИСТИКА ДОСТИЖЕНИЙ ===');
    console.log('ID | ФИО                | Достижения | Очки');
    console.log('-'.repeat(50));
    
    achievementStats.rows.forEach(user => {
      const name = `${user.first_name} ${user.last_name}`.padEnd(18);
      console.log(`${user.id}  | ${name} | ${user.achievements_count.toString().padEnd(10)} | ${user.total_points}`);
    });

    console.log(`\n📊 Всего пользователей: ${users.rows.length}`);
    console.log(`👨‍🎓 Студентов: ${users.rows.filter(u => u.role === 'student').length}`);
    console.log(`👨‍💼 Администраторов: ${users.rows.filter(u => u.role === 'admin').length}`);

  } catch (error) {
    console.error('❌ Ошибка при проверке пользователей:', error);
  } finally {
    process.exit(0);
  }
}

checkUsers();