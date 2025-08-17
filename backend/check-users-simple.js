#!/usr/bin/env node

const db = require('./config/database-sqlite');

async function checkUsers() {
  try {
    console.log('👥 Проверяю пользователей в базе данных...');
    
    const result = await db.query('SELECT id, login, role FROM users');
    
    console.log('Найдено пользователей:', result.rows.length);
    
    result.rows.forEach(user => {
      console.log(`- ID: ${user.id}, Логин: ${user.login}, Роль: ${user.role}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkUsers();