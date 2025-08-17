const db = require('../config/sqliteDatabase');

async function addTestEventRegistrations() {
  console.log('Добавление тестовых регистраций на мероприятия...');

  // Регистрируем студентов на различные мероприятия
  const registrations = [
    { userId: 2, eventId: 1 }, // Иван на Научную конференцию
    { userId: 2, eventId: 4 }, // Иван на Хакатон
    { userId: 3, eventId: 2 }, // Петр на Спортивные соревнования
    { userId: 3, eventId: 5 }, // Петр на Ярмарку талантов
    { userId: 4, eventId: 3 }, // Анна на Творческий вечер
    { userId: 4, eventId: 6 }, // Анна на Дебаты
  ];

  try {
    for (const reg of registrations) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO event_participants (userId, eventId, confirmed)
          VALUES (?, ?, 1)
        `, [reg.userId, reg.eventId], function(err) {
          if (err) reject(err);
          else {
            console.log(`✅ Пользователь ${reg.userId} зарегистрирован на мероприятие ${reg.eventId}`);
            resolve();
          }
        });
      });
    }

    // Добавим некоторые достижения пользователям
    const userAchievements = [
      { userId: 2, achievementId: 1 }, // Иван - Первые шаги
      { userId: 2, achievementId: 2 }, // Иван - Активист
      { userId: 3, achievementId: 1 }, // Петр - Первые шаги
      { userId: 4, achievementId: 1 }, // Анна - Первые шаги
      { userId: 4, achievementId: 2 }, // Анна - Активист
      { userId: 4, achievementId: 3 }, // Анна - Звезда школы
    ];

    for (const achievement of userAchievements) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO user_achievements (userId, achievementId)
          VALUES (?, ?)
        `, [achievement.userId, achievement.achievementId], function(err) {
          if (err) reject(err);
          else {
            console.log(`🏆 Пользователь ${achievement.userId} получил достижение ${achievement.achievementId}`);
            resolve();
          }
        });
      });
    }

    console.log('\n🎉 Тестовые регистрации и достижения добавлены!');

  } catch (error) {
    console.error('Ошибка при добавлении тестовых данных:', error);
  } finally {
    db.close(() => {
      console.log('База данных закрыта');
    });
  }
}

addTestEventRegistrations();