const database = require('../config/database-sqlite');

async function debugRankings() {
  try {
    console.log('🔍 Детальная проверка данных рейтинга...\n');

    // Проверяем все достижения в системе
    console.log('=== ДОСТИЖЕНИЯ В СИСТЕМЕ ===');
    const achievements = await database.query('SELECT id, title, points FROM achievements ORDER BY id');
    achievements.rows.forEach(achievement => {
      console.log(`${achievement.id}: ${achievement.title} (${achievement.points} очков)`);
    });

    // Проверяем пользовательские достижения
    console.log('\n=== ПОЛЬЗОВАТЕЛЬСКИЕ ДОСТИЖЕНИЯ ===');
    const userAchievements = await database.query(`
      SELECT 
        ua.user_id,
        u.first_name,
        u.last_name,
        ua.achievement_id,
        a.title,
        a.points,
        ua.awarded_at
      FROM user_achievements ua
      JOIN users u ON ua.user_id = u.id
      JOIN achievements a ON ua.achievement_id = a.id
      ORDER BY ua.user_id, ua.achievement_id
    `);
    
    userAchievements.rows.forEach(ua => {
      console.log(`Пользователь ${ua.user_id} (${ua.first_name} ${ua.last_name}): достижение "${ua.title}" (${ua.points} очков)`);
    });

    // Проверяем точный расчет очков по пользователям
    console.log('\n=== РАСЧЕТ ОЧКОВ ПО ПОЛЬЗОВАТЕЛЯМ ===');
    const pointsCalc = await database.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.class_grade,
        u.class_letter,
        GROUP_CONCAT(a.title || ' (' || a.points || ')') as achievements_list,
        COUNT(CASE WHEN ua.achievement_id IS NOT NULL THEN 1 END) as achievements_count,
        COALESCE(SUM(a.points), 0) as total_points
      FROM users u
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      LEFT JOIN achievements a ON ua.achievement_id = a.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.first_name, u.last_name, u.class_grade, u.class_letter
      ORDER BY total_points DESC
    `);

    pointsCalc.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.first_name} ${user.last_name} (${user.class_grade}${user.class_letter})`);
      console.log(`   Всего очков: ${user.total_points}`);
      console.log(`   Достижений: ${user.achievements_count}`);
      console.log(`   Список достижений: ${user.achievements_list || 'Нет достижений'}`);
    });

    // Проверяем тот же запрос, что использует API рейтинга
    console.log('\n=== ЗАПРОС API РЕЙТИНГА ===');
    const apiResult = await database.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.class_grade,
        u.class_letter,
        COALESCE(SUM(a.points), 0) as total_points,
        COUNT(CASE WHEN ua.achievement_id IS NOT NULL THEN 1 END) as achievements_count,
        RANK() OVER (ORDER BY COALESCE(SUM(a.points), 0) DESC) as rank_position
      FROM users u
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      LEFT JOIN achievements a ON ua.achievement_id = a.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.first_name, u.last_name, u.class_grade, u.class_letter
      ORDER BY total_points DESC, u.last_name ASC
    `);

    console.log('\nРезультат API запроса:');
    apiResult.rows.forEach(user => {
      console.log(`${user.rank_position}. ${user.first_name} ${user.last_name} - ${user.total_points} очков, ${user.achievements_count} достижений`);
    });

  } catch (error) {
    console.error('❌ Ошибка при проверке:', error);
  } finally {
    process.exit(0);
  }
}

debugRankings();