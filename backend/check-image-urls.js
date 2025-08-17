const sqlite3 = require('sqlite3').verbose();

// Подключаемся к базе данных
const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
        return;
    }
    console.log('✅ Подключен к SQLite базе данных');
});

// Проверяем изображения в событиях
db.all('SELECT id, title, image_url FROM events WHERE image_url IS NOT NULL', [], (err, rows) => {
    if (err) {
        console.error('Ошибка запроса:', err.message);
        return;
    }
    
    console.log('\n📷 События с изображениями:');
    rows.forEach((row) => {
        console.log(`ID: ${row.id}`);
        console.log(`Название: ${row.title}`);
        console.log(`URL изображения: ${row.image_url}`);
        console.log('---');
    });
    
    // Закрываем соединение
    db.close((err) => {
        if (err) {
            console.error('Ошибка закрытия базы данных:', err.message);
        } else {
            console.log('✅ Соединение с базой данных закрыто');
        }
    });
});