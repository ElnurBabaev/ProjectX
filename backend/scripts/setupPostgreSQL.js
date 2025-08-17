#!/usr/bin/env node

require('dotenv').config();

const initPostgreSQL = require('./initPostgreSQL');
const migrateDatabase = require('./migratePostgreSQL');
const createAdmin = require('./createAdminPostgreSQL');
const createStudent = require('./createStudentPostgreSQL');
const addTestData = require('./addTestDataPostgreSQL');

async function setupPostgreSQL() {
  console.log('🐘 ПОЛНАЯ НАСТРОЙКА POSTGRESQL СИСТЕМЫ');
  console.log('=====================================');
  console.log('');
  
  try {
    // 1. Инициализация базы данных
    console.log('📊 Шаг 1: Инициализация базы данных...');
    await initPostgreSQL();
    console.log('');
    
    // 2. Миграция схемы
    console.log('🔧 Шаг 2: Миграция схемы...');
    await migrateDatabase();
    console.log('');
    
    // 3. Создание администратора
    console.log('👤 Шаг 3: Создание администратора...');
    await createAdmin();
    console.log('');
    
    // 4. Создание тестового студента
    console.log('🎓 Шаг 4: Создание тестового студента...');
    await createStudent();
    console.log('');
    
    // 5. Добавление тестовых данных
    console.log('📁 Шаг 5: Добавление тестовых данных...');
    await addTestData();
    console.log('');
    
    console.log('🎉 ПОЛНАЯ НАСТРОЙКА ЗАВЕРШЕНА!');
    console.log('==============================');
    console.log('');
    console.log('✅ База данных PostgreSQL готова к работе!');
  console.log('� Админ: admin / admin123');
  console.log('👨‍🎓 Студент: student / student123');
    console.log('');
    console.log('🚀 Запустите сервер: npm start');
    
  } catch (error) {
    console.error('❌ Ошибка полной настройки:', error.message);
    process.exit(1);
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  setupPostgreSQL()
    .then(() => {
      console.log('✨ Настройка завершена!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Фатальная ошибка:', err);
      process.exit(1);
    });
}

module.exports = setupPostgreSQL;