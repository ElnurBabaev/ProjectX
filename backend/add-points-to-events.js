const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к базе данных
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔧 Добавляем поле points к событиям...');
console.log('📁 Путь к БД:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Ошибка подключения к БД:', err.message);
    return;
  }
  console.log('✅ Подключение к БД установлено');
});

// Проверяем текущую структуру таблицы
db.all("PRAGMA table_info(events)", (err, columns) => {
  if (err) {
    console.error('❌ Ошибка получения структуры таблицы:', err);
    return;
  }
  
  console.log('📋 Текущая структура таблицы events:');
  columns.forEach(col => console.log(`  - ${col.name}: ${col.type}`));
  
  // Проверяем, есть ли уже поле points
  const hasPointsColumn = columns.some(col => col.name === 'points');
  
  if (hasPointsColumn) {
    console.log('✅ Поле points уже существует');
    
    // Обновляем существующие события с баллами
    updateEventsWithPoints();
  } else {
    console.log('➕ Добавляем поле points...');
    
    db.run('ALTER TABLE events ADD COLUMN points INTEGER DEFAULT 0', (err) => {
      if (err) {
        console.error('❌ Ошибка добавления поля points:', err);
        return;
      }
      console.log('✅ Поле points добавлено успешно');
      
      // Обновляем существующие события с баллами
      updateEventsWithPoints();
    });
  }
});

function updateEventsWithPoints() {
  console.log('🎯 Обновляем события с баллами...');
  
  // Назначаем баллы существующим событиям
  const eventUpdates = [
    { title: 'Хакатон по программированию', points: 40 },
    { title: 'Школьная ярмарка талантов', points: 25 },
    { title: 'Дебаты старшеклассников', points: 35 },
    { title: 'Эко-квест', points: 30 },
    { title: 'Кулинарный мастер-класс', points: 20 },
    { title: 'Космическая викторина', points: 25 },
    { title: 'Олимпиада по математике', points: 50 },
    { title: 'Спортивные соревнования', points: 30 },
    { title: 'Творческий конкурс', points: 35 }
  ];
  
  let updatedCount = 0;
  
  eventUpdates.forEach((update, index) => {
    db.run(
      'UPDATE events SET points = ? WHERE title LIKE ? AND (points = 0 OR points IS NULL)',
      [update.points, `%${update.title}%`],
      function(err) {
        if (err) {
          console.error(`❌ Ошибка обновления события "${update.title}":`, err);
        } else if (this.changes > 0) {
          console.log(`✅ Обновлено событие "${update.title}": ${update.points} баллов`);
          updatedCount++;
        }
        
        // Если это последнее обновление
        if (index === eventUpdates.length - 1) {
          setTimeout(() => {
            console.log(`\n🎉 Миграция завершена! Обновлено событий: ${updatedCount}`);
            
            // Показываем финальное состояние
            db.all('SELECT id, title, points FROM events ORDER BY id', (err, rows) => {
              if (err) {
                console.error('❌ Ошибка получения событий:', err);
              } else {
                console.log('\n📊 Текущие события с баллами:');
                rows.forEach(row => {
                  console.log(`  - ${row.title}: ${row.points || 0} баллов`);
                });
              }
              
              db.close((err) => {
                if (err) {
                  console.error('❌ Ошибка закрытия БД:', err);
                } else {
                  console.log('✅ База данных закрыта');
                }
              });
            });
          }, 100);
        }
      }
    );
  });
}