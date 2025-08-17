const db = require('./config/database');

async function checkPoints() {
    try {
        const result = await db.query('SELECT id, login, first_name, points FROM users');
        console.log('🎯 Баллы всех пользователей:');
        result.rows.forEach(user => {
            console.log(`- ${user.login}: ${user.points || 'null'} баллов`);
        });
        
        // Проверим структуру таблицы
        const tableInfo = await db.query('PRAGMA table_info(users)');
        console.log('\n📋 Поля таблицы users:');
        tableInfo.rows.forEach(column => {
            console.log(`- ${column.name}: ${column.type}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

checkPoints();