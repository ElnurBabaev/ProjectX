const db = require('./config/database');

async function checkTables() {
    try {
        const result = await db.query('SELECT name FROM sqlite_master WHERE type="table"');
        console.log('📋 Таблицы в базе данных:');
        result.rows.forEach(table => {
            console.log(`  - ${table.name}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

checkTables();