require('dotenv').config();
const { Event, Product, User } = require('../models');

async function checkData() {
  console.log('🔍 Проверка данных в базе...');
  console.log('============================\n');

  try {
    // Проверяем пользователей
    const users = await User.getAllUsers();
    console.log('👥 ПОЛЬЗОВАТЕЛИ:');
    if (users.length === 0) {
      console.log('   Пользователей не найдено');
    } else {
      users.forEach(user => {
  console.log(`   - ${user.firstName} ${user.lastName} (login: ${user.login}) - ${user.role} - ${user.personalPoints} баллов`);
      });
    }

    // Проверяем мероприятия
    const events = await Event.getAllEvents();
    console.log('\n📅 МЕРОПРИЯТИЯ:');
    if (events.length === 0) {
      console.log('   Мероприятий не найдено');
    } else {
      events.forEach(event => {
        console.log(`   - ${event.title} (${event.date}) - ${event.pointsReward} баллов`);
      });
    }

    // Проверяем товары
    const products = await Product.getAllProducts();
    console.log('\n🛍️ ТОВАРЫ:');
    if (products.length === 0) {
      console.log('   Товаров не найдено');
    } else {
      products.forEach(product => {
        console.log(`   - ${product.name} (${product.price} баллов, осталось: ${product.stock})`);
      });
    }

    console.log('\n✅ Проверка завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке данных:', error);
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  checkData()
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Фатальная ошибка:', err);
      process.exit(1);
    });
}

module.exports = checkData;