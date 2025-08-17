const db = require('../config/sqliteDatabase');

console.log('Проверка данных в базе...');

// Проверяем мероприятия
db.all('SELECT * FROM events', [], (err, rows) => {
  if (err) {
    console.error('Ошибка получения мероприятий:', err);
  } else {
    console.log('=== МЕРОПРИЯТИЯ ===');
    if (rows.length === 0) {
      console.log('Мероприятий не найдено');
    } else {
      rows.forEach(event => {
        console.log(`- ${event.title} (${event.date})`);
      });
    }
  }

  // Проверяем товары
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      console.error('Ошибка получения товаров:', err);
    } else {
      console.log('\n=== ТОВАРЫ ===');
      if (rows.length === 0) {
        console.log('Товаров не найдено');
      } else {
        rows.forEach(product => {
          console.log(`- ${product.name} (${product.price} баллов, осталось: ${product.stock})`);
        });
      }
    }

    db.close(() => {
      console.log('\nПроверка завершена');
    });
  });
});