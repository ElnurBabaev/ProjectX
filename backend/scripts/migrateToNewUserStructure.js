const database = require('../config/database-sqlite');
const bcrypt = require('bcryptjs');

async function migrateToNewUserStructure() {
  try {
    console.log('🔧 Начинаем миграцию структуры пользователей...');

    // Проверяем, существует ли новая структура
    const checkColumns = await database.query(`
      PRAGMA table_info(users)
    `);
    
    const columns = checkColumns.rows.map(row => row.name);
    console.log('Текущие колонки в таблице users:', columns);

    // Если уже есть новые колонки, пропускаем миграцию
    if (columns.includes('login') && columns.includes('first_name') && columns.includes('last_name')) {
      console.log('✅ Новая структура пользователей уже существует');
      return;
    }

    console.log('📝 Создаем новую таблицу пользователей...');

    // Создаем новую таблицу с правильной структурой
    await database.query(`
      CREATE TABLE IF NOT EXISTS users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        class_grade INTEGER NOT NULL CHECK (class_grade >= 5 AND class_grade <= 11),
        class_letter TEXT NOT NULL CHECK (class_letter IN ('А', 'Б', 'В', 'Г')),
        role TEXT DEFAULT 'student' CHECK(role IN ('student', 'admin')),
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Если старая таблица существует, мигрируем данные
    if (columns.includes('username')) {
      console.log('📦 Мигрируем данные из старой структуры...');
      
      const oldUsers = await database.query('SELECT * FROM users');
      
      for (const user of oldUsers.rows) {
        // Парсим полное имя
        const nameParts = (user.full_name || '').split(' ');
        const firstName = nameParts[0] || 'Имя';
        const lastName = nameParts.slice(1).join(' ') || 'Фамилия';
        
        // Парсим класс
        const classMatch = (user.class || '10А').match(/(\d+)([А-Г])/);
        const classGrade = classMatch ? parseInt(classMatch[1]) : 10;
        const classLetter = classMatch ? classMatch[2] : 'А';
        
        await database.query(`
          INSERT INTO users_new (
            login, password, first_name, last_name, 
            class_grade, class_letter, role, 
            avatar_url, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          user.username || `user_${user.id}`,
          user.password,
          firstName,
          lastName,
          classGrade,
          classLetter,
          user.role || 'student',
          user.avatar_url,
          user.created_at,
          user.updated_at
        ]);
      }
      
      console.log(`✅ Мигрировано ${oldUsers.rows.length} пользователей`);
    }

    // Создаем админа и тестовых пользователей если их нет
    const existingUsers = await database.query('SELECT COUNT(*) as count FROM users_new');
    if (existingUsers.rows[0].count === 0) {
      console.log('👤 Создаем базовых пользователей...');
      
      const adminPassword = await bcrypt.hash('admin123', 12);
      await database.query(`
        INSERT INTO users_new (login, password, first_name, last_name, class_grade, class_letter, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['admin', adminPassword, 'Администратор', 'Системы', 11, 'А', 'admin']);

      const studentPassword = await bcrypt.hash('student123', 12);
      await database.query(`
        INSERT INTO users_new (login, password, first_name, last_name, class_grade, class_letter)
        VALUES 
          (?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?)
      `, [
        'ivanov', studentPassword, 'Иван', 'Иванов', 10, 'А',
        'petrov', studentPassword, 'Петр', 'Петров', 9, 'Б',
        'sidorova', studentPassword, 'Анна', 'Сидорова', 11, 'В'
      ]);
      
      console.log('✅ Базовые пользователи созданы');
    }

    // Заменяем старую таблицу новой
    if (columns.includes('username')) {
      await database.query('DROP TABLE users');
      console.log('🗑️ Старая таблица удалена');
    }
    
    await database.query('ALTER TABLE users_new RENAME TO users');
    console.log('🔄 Новая таблица переименована');

    // Создаем индекс
    await database.query('CREATE INDEX IF NOT EXISTS idx_users_login ON users(login)');
    console.log('📊 Индекс создан');

    console.log('🎉 Миграция завершена успешно!');
    console.log('📋 Данные для входа:');
    console.log('   Администратор: admin / admin123');
    console.log('   Студенты: ivanov, petrov, sidorova / student123');

  } catch (error) {
    console.error('❌ Ошибка во время миграции:', error);
    throw error;
  }
}

// Запуск миграции, если скрипт вызван напрямую
if (require.main === module) {
  migrateToNewUserStructure()
    .then(() => {
      console.log('✅ Миграция выполнена');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = { migrateToNewUserStructure };