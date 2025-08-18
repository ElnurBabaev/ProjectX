const database = require('../config/database-sqlite');

async function explainPointsSystem() {
  try {
    console.log('📊 АНАЛИЗ СИСТЕМЫ ОЧКОВ И БАЛЛОВ\n');

    // 1. Проверяем структуру таблицы пользователей
    console.log('🔍 СТРУКТУРА ТАБЛИЦЫ USERS:');
    const userSchema = await database.query('PRAGMA table_info(users)');
    userSchema.rows.forEach(col => {
      if (col.name.includes('point') || col.name.includes('balance') || col.name.includes('score')) {
        console.log(`- ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
      }
    });

    // 2. Проверяем достижения и их очки
    console.log('\n🏆 СИСТЕМА ДОСТИЖЕНИЙ (ACHIEVEMENTS):');
    const achievements = await database.query('SELECT id, title, points, type FROM achievements ORDER BY points DESC');
    console.log('Достижения начисляют ОЧКИ (points):');
    achievements.rows.forEach(a => {
      console.log(`- "${a.title}": ${a.points} очков (тип: ${a.type})`);
    });

    // 3. Рассчитываем общие очки пользователей от достижений
    console.log('\n💯 ОЧКИ ЗА ДОСТИЖЕНИЯ (используются в рейтинге):');
    const userPoints = await database.query(`
      SELECT 
        u.first_name,
        u.last_name,
        COALESCE(SUM(a.points), 0) as achievement_points,
        COUNT(CASE WHEN ua.achievement_id IS NOT NULL THEN 1 END) as achievements_count
      FROM users u
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      LEFT JOIN achievements a ON ua.achievement_id = a.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY achievement_points DESC
      LIMIT 5
    `);

    userPoints.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name}: ${user.achievement_points} очков от ${user.achievements_count} достижений`);
    });

    // 4. Проверяем, есть ли отдельная система баллов
    console.log('\n🔍 ПОИСК ДРУГИХ СИСТЕМ БАЛЛОВ:');
    
    // Проверяем все столбцы всех таблиц на наличие "points", "balance", "score"
    const tables = await database.query("SELECT name FROM sqlite_master WHERE type='table'");
    
    for (const table of tables.rows) {
      const schema = await database.query(`PRAGMA table_info(${table.name})`);
      const pointsColumns = schema.rows.filter(col => 
        col.name.toLowerCase().includes('point') || 
        col.name.toLowerCase().includes('balance') || 
        col.name.toLowerCase().includes('score') ||
        col.name.toLowerCase().includes('money') ||
        col.name.toLowerCase().includes('credit')
      );
      
      if (pointsColumns.length > 0) {
        console.log(`Таблица "${table.name}":`);
        pointsColumns.forEach(col => {
          console.log(`  - ${col.name}: ${col.type}`);
        });
      }
    }

    console.log('\n📝 ВЫВОД:');
    console.log('В приложении используется система ОЧКОВ ЗА ДОСТИЖЕНИЯ.');
    console.log('Рейтинг основан на сумме очков от полученных достижений.');
    console.log('Каждое достижение имеет определенное количество очков.');
    console.log('Участие в мероприятиях -> получение достижений -> накопление очков -> позиция в рейтинге');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit(0);
  }
}

explainPointsSystem();