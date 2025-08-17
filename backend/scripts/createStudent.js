#!/usr/bin/env node

require('dotenv').config();
const { User } = require('../models');

async function createStudent() {
  try {
    console.log('👨‍🎓 СОЗДАНИЕ ТЕСТОВОГО СТУДЕНТА');
    console.log('================================');

    // Проверяем, не существует ли уже студент
  const existingStudent = await User.findByLogin('student');
    if (existingStudent) {
      console.log('✅ Студент уже существует!');
  console.log(`� Login: ${existingStudent.login}`);
      console.log(`👤 Имя: ${existingStudent.firstName} ${existingStudent.lastName}`);
      console.log(`🎒 Класс: ${existingStudent.classGrade}${existingStudent.classLetter}`);
      console.log(`🎭 Роль: ${existingStudent.role}`);
      return;
    }

    // Создаем студента
    const student = await User.create({
  login: 'student',
      password: 'student123',
      firstName: 'Иван',
      lastName: 'Иванов',
      classGrade: 10,
      classLetter: 'А',
      role: 'student',
      personalPoints: 120
    });

    console.log('✅ Студент успешно создан!');
  console.log(`� Login: student`);
    console.log(`🔑 Пароль: student123`);
    console.log(`👤 ID: ${student.id}`);
    console.log(`🎒 Класс: ${student.classGrade}${student.classLetter}`);
    console.log(`🏆 Очки: ${student.personalPoints}`);
    console.log(`🎭 Роль: ${student.role}`);

  } catch (error) {
    console.error('❌ Ошибка создания студента:', error.message);
    process.exit(1);
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  createStudent()
    .then(() => {
      console.log('✨ Готово!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Фатальная ошибка:', err);
      process.exit(1);
    });
}

module.exports = createStudent;