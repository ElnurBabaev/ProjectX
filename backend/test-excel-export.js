#!/usr/bin/env node

/**
 * Скрипт для тестирования экспорта участников в Excel
 * Создаёт тестовое событие и несколько участников для проверки функции экспорта
 */

const db = require('./config/database-sqlite');
const bcrypt = require('bcryptjs');

async function createTestDataForExport() {
  try {
    console.log('🧪 Создаю тестовые данные для проверки экспорта Excel...');

    // 1. Создаём тестовых пользователей (студентов)
    const testUsers = [
      { login: 'test_student1', firstName: 'Александр', lastName: 'Иванов', grade: 9, letter: 'А' },
      { login: 'test_student2', firstName: 'Мария', lastName: 'Петрова', grade: 10, letter: 'Б' },
      { login: 'test_student3', firstName: 'Дмитрий', lastName: 'Сидоров', grade: 11, letter: 'В' },
      { login: 'test_student4', firstName: 'Анна', lastName: 'Козлова', grade: 9, letter: 'А' },
      { login: 'test_student5', firstName: 'Михаил', lastName: 'Морозов', grade: 10, letter: 'Г' }
    ];

    const hashedPassword = await bcrypt.hash('testpass123', 12);
    const userIds = [];

    for (const user of testUsers) {
      // Проверяем, существует ли уже такой пользователь
      const existingUser = await db.query('SELECT id FROM users WHERE login = ?', [user.login]);
      
      if (existingUser.rows.length > 0) {
        console.log(`👤 Пользователь ${user.login} уже существует, используем его`);
        userIds.push(existingUser.rows[0].id);
      } else {
        console.log(`👤 Создаю пользователя: ${user.firstName} ${user.lastName} (${user.grade}${user.letter})`);
        const result = await db.query(`
          INSERT INTO users (login, password, first_name, last_name, class_grade, class_letter, role)
          VALUES (?, ?, ?, ?, ?, ?, 'student')
        `, [user.login, hashedPassword, user.firstName, user.lastName, user.grade, user.letter]);
        
        userIds.push(result.insertId);
      }
    }

    // 2. Создаём тестовое событие
    const testEvent = {
      title: 'Тестовое мероприятие для экспорта',
      description: 'Это тестовое мероприятие для проверки функции экспорта участников в Excel',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // через неделю
      location: 'Актовый зал',
      maxParticipants: 100,
      points: 50
    };

    console.log(`🎭 Создаю тестовое событие: ${testEvent.title}`);
    const eventResult = await db.query(`
      INSERT INTO events (title, description, start_date, location, max_participants, points, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [testEvent.title, testEvent.description, testEvent.startDate, testEvent.location, testEvent.maxParticipants, testEvent.points, 1]);

    const eventId = eventResult.insertId;

    // 3. Регистрируем пользователей на событие
    console.log(`📝 Регистрирую участников на событие...`);
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const status = i % 2 === 0 ? 'attended' : 'registered'; // половина присутствовала, половина просто зарегистрирована
      
      await db.query(`
        INSERT INTO event_registrations (event_id, user_id, status, registered_at)
        VALUES (?, ?, ?, datetime('now', '-${i} hours'))
      `, [eventId, userId, status]);

      console.log(`✅ Пользователь ID ${userId} зарегистрирован со статусом: ${status}`);
    }

    console.log('\n✨ Тестовые данные успешно созданы!');
    console.log(`📊 Создано событие ID: ${eventId}`);
    console.log(`👥 Зарегистрировано участников: ${userIds.length}`);
    console.log('\n🔗 Теперь можно протестировать экспорт:');
    console.log('1. Зайдите в админ-панель');
    console.log('2. Перейдите в раздел "События"');
    console.log('3. Найдите тестовое мероприятие и нажмите "Участники"');
    console.log('4. В открывшемся окне нажмите кнопку "Экспорт"');

  } catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Запускаем создание тестовых данных
createTestDataForExport();