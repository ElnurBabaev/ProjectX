const database = require('../config/database-sqlite');

async function updateDatabaseForPointsSystem() {
  try {
    console.log('🔧 Обновление базы данных для новой системы баллов...\n');

    // 1. Добавляем поле points к таблице events
    console.log('📅 Добавляем поле points к мероприятиям...');
    try {
      await database.query(`
        ALTER TABLE events ADD COLUMN points INTEGER DEFAULT 0
      `);
      console.log('✅ Поле points добавлено к таблице events');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ Поле points уже существует в таблице events');
      } else {
        throw error;
      }
    }

    // 2. Добавляем поле total_points к таблице users
    console.log('👤 Добавляем поле total_points к пользователям...');
    try {
      await database.query(`
        ALTER TABLE users ADD COLUMN total_points INTEGER DEFAULT 0
      `);
      console.log('✅ Поле total_points добавлено к таблице users');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ Поле total_points уже существует в таблице users');
      } else {
        throw error;
      }
    }

    // 3. Добавляем поле points_awarded к таблице event_registrations
    console.log('📝 Добавляем поле points_awarded к регистрациям...');
    try {
      await database.query(`
        ALTER TABLE event_registrations ADD COLUMN points_awarded INTEGER DEFAULT 0
      `);
      console.log('✅ Поле points_awarded добавлено к таблице event_registrations');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️ Поле points_awarded уже существует в таблице event_registrations');
      } else {
        throw error;
      }
    }

    // 4. Обновляем существующие мероприятия с тестовыми баллами
    console.log('🎯 Устанавливаем баллы для существующих мероприятий...');
    const events = await database.query('SELECT id, title FROM events');
    
    for (const event of events.rows) {
      // Случайные баллы от 10 до 50 для демонстрации
      const randomPoints = Math.floor(Math.random() * 41) + 10; // 10-50 баллов
      await database.query(
        'UPDATE events SET points = ? WHERE id = ?',
        [randomPoints, event.id]
      );
      console.log(`  - "${event.title}": ${randomPoints} баллов`);
    }

    // 5. Пересчитываем общие баллы пользователей на основе участия в мероприятиях
    console.log('🔄 Пересчитываем общие баллы пользователей...');
    
    // Сначала обнуляем все баллы
    await database.query('UPDATE users SET total_points = 0 WHERE role = "student"');
    
    // Затем рассчитываем на основе участия в мероприятиях
    const participations = await database.query(`
      SELECT 
        er.user_id,
        er.event_id,
        er.status,
        e.points as event_points,
        e.title as event_title,
        u.first_name,
        u.last_name
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.user_id = u.id
      WHERE er.status IN ('attended', 'registered') AND u.role = 'student'
    `);

    const userPoints = {};
    
    for (const participation of participations.rows) {
      const userId = participation.user_id;
      const points = participation.event_points || 0;
      
      if (!userPoints[userId]) {
        userPoints[userId] = {
          name: `${participation.first_name} ${participation.last_name}`,
          total: 0,
          events: []
        };
      }
      
      userPoints[userId].total += points;
      userPoints[userId].events.push({
        title: participation.event_title,
        points: points,
        status: participation.status
      });

      // Обновляем points_awarded в регистрации
      await database.query(
        'UPDATE event_registrations SET points_awarded = ? WHERE user_id = ? AND event_id = ?',
        [points, userId, participation.event_id]
      );
    }

    // Обновляем общие баллы пользователей
    for (const [userId, userData] of Object.entries(userPoints)) {
      await database.query(
        'UPDATE users SET total_points = ? WHERE id = ?',
        [userData.total, userId]
      );
      console.log(`  - ${userData.name}: ${userData.total} баллов за ${userData.events.length} мероприятий`);
    }

    // 6. Показываем обновленную статистику
    console.log('\n📊 НОВАЯ СИСТЕМА РЕЙТИНГА:');
    const newRanking = await database.query(`
      SELECT 
        u.first_name,
        u.last_name,
        u.class_grade,
        u.class_letter,
        u.total_points,
        COUNT(er.id) as events_participated
      FROM users u
      LEFT JOIN event_registrations er ON u.id = er.user_id AND er.status IN ('attended', 'registered')
      WHERE u.role = 'student'
      GROUP BY u.id, u.first_name, u.last_name, u.class_grade, u.class_letter, u.total_points
      ORDER BY u.total_points DESC, u.last_name ASC
    `);

    console.log('Рейтинг по баллам за участие в мероприятиях:');
    newRanking.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name} (${user.class_grade}${user.class_letter}) - ${user.total_points} баллов (${user.events_participated} мероприятий)`);
    });

    console.log('\n✅ База данных успешно обновлена для новой системы баллов!');
    console.log('🎯 Теперь рейтинг основан на баллах за участие в мероприятиях');
    console.log('👨‍💼 Администратор может устанавливать баллы для каждого мероприятия');

  } catch (error) {
    console.error('❌ Ошибка при обновлении базы данных:', error);
  } finally {
    process.exit(0);
  }
}

updateDatabaseForPointsSystem();