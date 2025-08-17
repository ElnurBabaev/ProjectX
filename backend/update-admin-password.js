#!/usr/bin/env node

const db = require('./config/database-sqlite');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
  try {
    console.log('🔧 Обновляю пароль администратора...');
    
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await db.query('UPDATE users SET password = ? WHERE login = ?', [hashedPassword, 'admin']);
    
    console.log('✅ Пароль администратора обновлен на "admin123"');
    console.log('📝 Логин: admin');
    console.log('🔑 Пароль: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

updateAdminPassword();