#!/usr/bin/env node

require('dotenv').config();
const { User } = require('../models');

async function createAdmin() {
  try {
    console.log('🔧 СОЗДАНИЕ АДМИНИСТРАТОРА');
    console.log('========================');

    // Проверяем, не существует ли уже админ
  const existingAdmin = await User.findByLogin('admin');
    if (existingAdmin) {
      console.log('✅ Администратор уже существует!');
  console.log(`� Login: ${existingAdmin.login}`);
      console.log(`👤 Имя: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      console.log(`🎭 Роль: ${existingAdmin.role}`);
      return;
    }

    // Создаем админа
    const admin = await User.create({
  login: 'admin',
      password: 'admin123',
      firstName: 'Администратор',
      lastName: 'Системы',
      classGrade: 11,
      classLetter: 'А',
      role: 'admin'
    });

    console.log('✅ Администратор успешно создан!');
  console.log(`� Login: admin`);
    console.log(`🔑 Пароль: admin123`);
    console.log(`👤 ID: ${admin.id}`);
    console.log(`🎭 Роль: ${admin.role}`);
    console.log('');
    console.log('⚠️  ВАЖНО: Смените пароль после первого входа!');

  } catch (error) {
    console.error('❌ Ошибка создания администратора:', error.message);
    process.exit(1);
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  createAdmin()
    .then(() => {
      console.log('✨ Готово!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Фатальная ошибка:', err);
      process.exit(1);
    });
}

module.exports = createAdmin;