#!/usr/bin/env node

require('dotenv').config();
const db = require('../config/database');

async function updateAdminRole() {
  try {
    console.log('🔧 ОБНОВЛЕНИЕ РОЛИ АДМИНИСТРАТОРА');
    console.log('===============================');

    // Обновляем роль существующего админа
  const query = `UPDATE users SET is_admin = true WHERE login = 'admin' RETURNING *`;
    const result = await db.query(query);
    
    if (result.rows.length > 0) {
      const admin = result.rows[0];
      console.log('✅ Роль администратора обновлена!');
  console.log(`� Login: ${admin.login}`);
      console.log(`👤 Имя: ${admin.first_name} ${admin.last_name}`);
      console.log(`🎭 Админ: ${admin.is_admin}`);
    } else {
      console.log('❌ Администратор не найден');
    }

  } catch (error) {
    console.error('❌ Ошибка обновления роли:', error.message);
    process.exit(1);
  }
}

updateAdminRole()
  .then(() => {
    console.log('✨ Готово!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Фатальная ошибка:', err);
    process.exit(1);
  });