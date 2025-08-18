const database = require('../config/database-sqlite');

async function addTestAchievements() {
  try {
    console.log('🏆 Добавление тестовых достижений пользователям...');

    // Получаем всех студентов
    const studentsResult = await database.query('SELECT id FROM users WHERE role = "student"');
    const students = studentsResult.rows;

    if (students.length === 0) {
      console.log('❌ Студенты не найдены');
      return;
    }

    // Получаем все достижения
    const achievementsResult = await database.query('SELECT id, points FROM achievements');
    const achievements = achievementsResult.rows;

    if (achievements.length === 0) {
      console.log('❌ Достижения не найдены');
      return;
    }

    console.log(`📊 Найдено ${students.length} студентов и ${achievements.length} достижений`);

    // Даем случайные достижения студентам
    for (const student of students) {
      // Случайное количество достижений для каждого студента (от 1 до 3)
      const numAchievements = Math.floor(Math.random() * 3) + 1;
      
      // Перемешиваем достижения и берем первые numAchievements
      const shuffledAchievements = achievements.sort(() => 0.5 - Math.random());
      const selectedAchievements = shuffledAchievements.slice(0, numAchievements);

      for (const achievement of selectedAchievements) {
        try {
          // Проверяем, есть ли уже это достижение у пользователя
          const existingResult = await database.query(
            'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
            [student.id, achievement.id]
          );

          if (existingResult.rows.length === 0) {
            // Добавляем достижение
            await database.query(
              'INSERT INTO user_achievements (user_id, achievement_id, awarded_at) VALUES (?, ?, ?)',
              [student.id, achievement.id, new Date().toISOString()]
            );
            
            console.log(`✅ Пользователь ${student.id} получил достижение ${achievement.id} (${achievement.points} очков)`);
          }
        } catch (error) {
          // Игнорируем ошибки дублирования
          if (!error.message.includes('UNIQUE constraint failed')) {
            console.error('❌ Ошибка при добавлении достижения:', error);
          }
        }
      }
    }

    // Выводим статистику
    const statsResult = await database.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.class_grade,
        u.class_letter,
        COUNT(ua.achievement_id) as achievements_count,
        COALESCE(SUM(a.points), 0) as total_points
      FROM users u
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      LEFT JOIN achievements a ON ua.achievement_id = a.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.first_name, u.last_name, u.class_grade, u.class_letter
      ORDER BY total_points DESC
    `);

    console.log('\n🏆 РЕЙТИНГ УЧЕНИКОВ:');
    console.log('='.repeat(60));
    statsResult.rows.forEach((student, index) => {
      console.log(`${index + 1}. ${student.first_name} ${student.last_name} (${student.class_grade}${student.class_letter}) - ${student.total_points} очков, ${student.achievements_count} достижений`);
    });

    console.log('\n✅ Тестовые достижения добавлены успешно!');

  } catch (error) {
    console.error('❌ Ошибка при добавлении тестовых достижений:', error);
  }
}

// Запуск если скрипт вызван напрямую
if (require.main === module) {
  addTestAchievements()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = { addTestAchievements };