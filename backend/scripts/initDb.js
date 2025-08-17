require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'postgres', // Подключаемся к системной базе для создания нашей базы
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Создание базы данных...');
    
    // Создаем базу данных если она не существует
    await client.query(`
      SELECT 'CREATE DATABASE ${process.env.DB_NAME}'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${process.env.DB_NAME}')
    `).then(async (result) => {
      if (result.rows.length > 0) {
        await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log(`База данных ${process.env.DB_NAME} создана`);
      } else {
        console.log(`База данных ${process.env.DB_NAME} уже существует`);
      }
    }).catch(() => {
      // База данных уже может существовать
    });
    
    client.release();
    
    // Подключаемся к созданной базе данных
    const appPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    
    const appClient = await appPool.connect();
    
    console.log('Создание таблиц...');
    
    // Создаем таблицы
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        class_grade INTEGER NOT NULL CHECK (class_grade >= 5 AND class_grade <= 11),
        class_letter VARCHAR(1) NOT NULL CHECK (class_letter IN ('А', 'Б', 'В', 'Г')),
        role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
        personal_points INTEGER DEFAULT 0,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Таблица users создана');
    
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        points INTEGER NOT NULL,
        max_participants INTEGER NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Таблица events создана');
    
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS event_participants (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled')),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP,
        points_awarded INTEGER DEFAULT 0,
        UNIQUE(event_id, user_id)
      );
    `);
    console.log('✓ Таблица event_participants создана');
    
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(100) NOT NULL,
        condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('points', 'events')),
        condition_value INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Таблица achievements создана');
    
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      );
    `);
    console.log('✓ Таблица user_achievements создана');
    
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        price INTEGER NOT NULL,
        image_url VARCHAR(500),
        stock_quantity INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Таблица products создана');
    
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        price_paid INTEGER NOT NULL,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Таблица purchases создана');
    
    console.log('\nВставка демо-данных...');
    
    // Создаем администратора
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    await appClient.query(`
      INSERT INTO users (login, password_hash, first_name, last_name, class_grade, class_letter, personal_points, role)
      VALUES ('admin', $1, 'Администратор', 'Системы', 11, 'А', 1000, 'admin')
      ON CONFLICT (login) DO NOTHING
    `, [adminPassword]);
  console.log('✓ Администратор создан (login: admin, пароль: admin123)');
    
    // Создаем тестовых пользователей
    const studentPassword = await bcrypt.hash('student123', 12);
    await appClient.query(`
      INSERT INTO users (login, password_hash, first_name, last_name, class_grade, class_letter, personal_points)
      VALUES 
        ('ivanov', $1, 'Иван', 'Иванов', 10, 'А', 150),
        ('petrov', $1, 'Петр', 'Петров', 9, 'Б', 200),
        ('sidorova', $1, 'Анна', 'Сидорова', 11, 'В', 300)
      ON CONFLICT (login) DO NOTHING
    `, [studentPassword]);
  console.log('✓ Тестовые студенты созданы (логин: ivanov/petrov/sidorova, пароль для всех: student123)');
    
    // Создаем тестовые мероприятия
    await appClient.query(`
      INSERT INTO events (title, description, type, points, max_participants, start_date, end_date)
      VALUES 
        ('Олимпиада по математике', 'Школьная олимпиада по математике для учеников 9-11 классов', 'олимпиада', 50, 30, '2025-09-01 10:00:00', '2025-09-01 14:00:00'),
        ('День здоровья', 'Спортивные соревнования и эстафеты для всех классов', 'спорт', 30, 100, '2025-09-15 09:00:00', '2025-09-15 16:00:00'),
        ('Концерт ко Дню учителя', 'Творческий концерт учеников школы', 'концерт', 40, 25, '2025-10-05 15:00:00', '2025-10-05 17:00:00'),
        ('Экологическая акция', 'Уборка школьной территории и посадка деревьев', 'акция', 25, 50, '2025-10-20 10:00:00', '2025-10-20 13:00:00')
      ON CONFLICT DO NOTHING
    `);
    console.log('✓ Тестовые мероприятия созданы');
    
    // Создаем достижения
    await appClient.query(`
      INSERT INTO achievements (title, description, icon, condition_type, condition_value)
      VALUES 
        ('Первые шаги', 'Получите первые 10 баллов', '🏆', 'points', 10),
        ('Активист', 'Примите участие в 5 мероприятиях', '⭐', 'events', 5),
        ('Лидер', 'Наберите 100 баллов', '👑', 'points', 100),
        ('Мегаактивист', 'Примите участие в 10 мероприятиях', '🔥', 'events', 10),
        ('Чемпион', 'Наберите 500 баллов', '🥇', 'points', 500)
      ON CONFLICT DO NOTHING
    `);
    console.log('✓ Достижения созданы');
    
    // Создаем товары в магазине
    await appClient.query(`
      INSERT INTO products (title, description, price, stock_quantity)
      VALUES 
        ('Ручка школьная', 'Качественная шариковая ручка с логотипом школы', 10, 100),
        ('Блокнот', 'Блокнот формата A5 с символикой школы', 25, 50),
        ('Футболка школьная', 'Футболка с логотипом школы, размеры S-XXL', 75, 30),
        ('Кружка', 'Керамическая кружка с надписью "Лучший ученик"', 40, 25),
        ('Рюкзак', 'Удобный рюкзак для школы', 150, 15),
        ('Стикеры', 'Набор мотивирующих стикеров', 15, 80)
      ON CONFLICT DO NOTHING
    `);
    console.log('✓ Товары в магазине созданы');
    
    appClient.release();
    await appPool.end();
    
    console.log('\n🎉 База данных успешно инициализирована!');
  console.log('\nДанные для входа:');
  console.log('Администратор: admin / admin123');
  console.log('Студенты: ivanov, petrov, sidorova / student123');
    
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();