const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/database.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

async function testLoginAPI() {
  try {
    console.log('🔍 Тестируем POST /auth/login API...\n');
    
    const login = 'admin';
    const password = 'admin123';
    
    console.log('🔐 Попытка входа:', { login, hasPassword: !!password });

    const result = await db.query(
      'SELECT * FROM users WHERE login = ?',
      [login]
    );
    
    const user = result.rows[0];
    if (!user) {
      console.log('❌ Пользователь не найден:', login);
      return;
    }
    console.log('✅ Пользователь найден:', { id: user.id, login: user.login, avatar_url: user.avatar_url });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Неверный пароль для пользователя:', login);
      return;
    }

    console.log('✅ Успешный вход пользователя:', { id: user.id, login: user.login });

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    const loginResponse = {
      message: 'Авторизация успешна',
      token,
      user: {
        id: user.id,
        login: user.login,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name} ${user.last_name}`,
        class: `${user.class_grade}${user.class_letter}`,
        class_grade: user.class_grade,
        class_letter: user.class_letter,
        role: user.role,
        isAdmin: user.role === 'admin',
        avatar_url: user.avatar_url
      }
    };
    
    console.log('\n📤 Ответ API логина:');
    console.log(JSON.stringify(loginResponse, null, 2));
    
    console.log('\n🎯 Проверяем avatar_url:');
    console.log(`DB avatar_url: "${user.avatar_url}"`);
    console.log(`API avatar_url: "${loginResponse.user.avatar_url}"`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
  
  process.exit(0);
}

testLoginAPI();