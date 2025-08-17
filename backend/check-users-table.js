const db = require('./config/database');

async function checkUsersTable() {
    try {
        // Проверяем структуру таблицы
        const tableInfo = await db.query('PRAGMA table_info(users)');
        console.log('📋 Структура таблицы users:');
        tableInfo.rows.forEach(column => {
            console.log(`  - ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : '(NULL)'} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
        });
        
        // Проверяем пример записи
        const sampleUser = await db.query('SELECT * FROM users LIMIT 1');
        console.log('\n👤 Пример записи пользователя:');
        console.log(JSON.stringify(sampleUser.rows[0], null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

checkUsersTable();