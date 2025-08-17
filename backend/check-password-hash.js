#!/usr/bin/env node

const db = require('./config/database-sqlite');
const bcrypt = require('bcryptjs');

async function checkPasswordHash() {
  try {
    console.log('🔍 Проверяю хеш пароля в базе данных...');
    
    const result = await db.query('SELECT login, password FROM users WHERE login = ?', ['admin']);
    
    if (result.rows.length === 0) {
      console.log('❌ Пользователь admin не найден');
      return;
    }
    
    const user = result.rows[0];
    console.log(`👤 Пользователь: ${user.login}`);
    console.log(`🔐 Хеш в БД: ${user.password}`);
    
    // Тестируем разные пароли
    const passwords = ['admin', 'admin123', 'password', '123456'];
    
    for (const testPassword of passwords) {
      console.log(`\n🧪 Тестирую пароль: "${testPassword}"`);
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`✅ Результат: ${isValid ? 'ВЕРНЫЙ' : 'неверный'}`);
      
      if (isValid) {
        console.log(`🎯 НАЙДЕН ПРАВИЛЬНЫЙ ПАРОЛЬ: "${testPassword}"`);
        break;
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkPasswordHash();