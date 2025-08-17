const database = require('../config/database-sqlite');
const path = require('path');

async function initDatabase() {
  try {
    console.log('🔧 Инициализация базы данных SQLite...');

    // Создание таблицы пользователей с новой структурой
    await database.query(`
      CREATE TABLE IF NOT EXISTS users (
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

    // Создание таблицы событий
    await database.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_date DATETIME NOT NULL,
        end_date DATETIME,
        location TEXT,
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        image_url TEXT,
        status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
        created_by INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы регистраций на события
    await database.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'registered' CHECK(status IN ('registered', 'attended', 'missed', 'cancelled')),
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      )
    `);

    // Создание таблицы достижений
    await database.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        type TEXT DEFAULT 'participation' CHECK(type IN ('participation', 'excellence', 'leadership', 'community')),
        points INTEGER DEFAULT 0,
        requirements TEXT,
        badge_color TEXT DEFAULT '#3B82F6',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы пользовательских достижений
    await database.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        event_id INTEGER REFERENCES events(id),
        notes TEXT,
        UNIQUE(user_id, achievement_id)
      )
    `);

    // Создание таблицы товаров
    await database.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        category TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы заказов
    await database.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
        shipping_address TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы элементов заказа
    await database.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание индексов для улучшения производительности
    await database.query('CREATE INDEX IF NOT EXISTS idx_users_login ON users(login)');
    await database.query('CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)');
    await database.query('CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date)');
    await database.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id)');
    await database.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id)');
    await database.query('CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)');
    await database.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');

    console.log('✅ База данных SQLite успешно инициализирована!');

    // Добавляем тестовые данные
    await addTestData();

  } catch (error) {
    console.error('❌ Ошибка при инициализации базы данных:', error);
    throw error;
  }
}

async function addTestData() {
  console.log('📝 Добавление тестовых данных...');

  try {
    // Проверяем, есть ли уже пользователи
    const existingUsers = await database.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers.rows[0].count > 0) {
      console.log('ℹ️ Пользователи уже существуют, пропускаем добавление тестовых данных');
      return;
    }

    // Добавляем администратора
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    await database.query(`
      INSERT INTO users (login, password, first_name, last_name, class_grade, class_letter, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['admin', adminPassword, 'Администратор', 'Системы', 11, 'А', 'admin']);

    // Добавляем тестовых студентов
    const studentPassword = await bcrypt.hash('student123', 12);
    await database.query(`
      INSERT INTO users (login, password, first_name, last_name, class_grade, class_letter)
      VALUES 
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?)
    `, [
      'ivanov', studentPassword, 'Иван', 'Иванов', 10, 'А',
      'petrov', studentPassword, 'Петр', 'Петров', 9, 'Б',
      'sidorova', studentPassword, 'Анна', 'Сидорова', 11, 'В'
    ]);

    // Добавляем тестовое событие
    await database.query(`
      INSERT INTO events (title, description, start_date, end_date, location, max_participants, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Школьная олимпиада по математике',
      'Ежегодная математическая олимпиада для учеников 9-11 классов',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Через неделю
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +3 часа
      'Актовый зал',
      50,
      1
    ]);

    // Добавляем достижения
    const achievements = [
      {
        title: 'Первое участие',
        description: 'Участие в первом школьном мероприятии',
        icon: '🌟',
        type: 'participation',
        points: 10,
        badge_color: '#10B981'
      },
      {
        title: 'Активный участник',
        description: 'Участие в 5 мероприятиях',
        icon: '🏃',
        type: 'participation',
        points: 50,
        badge_color: '#3B82F6'
      },
      {
        title: 'Лидер',
        description: 'Организация школьного мероприятия',
        icon: '👑',
        type: 'leadership',
        points: 100,
        badge_color: '#F59E0B'
      }
    ];

    for (const achievement of achievements) {
      await database.query(`
        INSERT INTO achievements (title, description, icon, type, points, badge_color)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [achievement.title, achievement.description, achievement.icon, achievement.type, achievement.points, achievement.badge_color]);
    }

    // Добавляем товары
    const products = [
      {
        name: 'Школьная футболка',
        description: 'Удобная футболка с логотипом школы',
        price: 15.99,
        stock_quantity: 100,
        category: 'Одежда'
      },
      {
        name: 'Школьная кружка',
        description: 'Керамическая кружка с символикой школы',
        price: 8.99,
        stock_quantity: 50,
        category: 'Аксессуары'
      },
      {
        name: 'Блокнот с логотипом',
        description: 'Качественный блокнот для заметок',
        price: 5.99,
        stock_quantity: 75,
        category: 'Канцелярия'
      }
    ];

    for (const product of products) {
      await database.query(`
        INSERT INTO products (name, description, price, stock_quantity, category)
        VALUES (?, ?, ?, ?, ?)
      `, [product.name, product.description, product.price, product.stock_quantity, product.category]);
    }

    console.log('✅ Тестовые данные добавлены!');
    console.log('👤 Администратор: admin / admin123');
    console.log('👨‍🎓 Студенты: ivanov, petrov, sidorova / student123');

  } catch (error) {
    console.error('❌ Ошибка при добавлении тестовых данных:', error);
  }
}

// Запуск инициализации, если скрипт вызван напрямую
if (require.main === module) {
  initDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase, addTestData };