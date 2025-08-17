const db = require('./config/database');

async function addPointsColumn() {
    try {
        // Добавляем колонку points в таблицу users
        await db.query('ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0');
        console.log('✅ Колонка points добавлена в таблицу users');
        
        // Проверяем результат
        const tableInfo = await db.query('PRAGMA table_info(users)');
        console.log('\n📋 Обновленная структура таблицы users:');
        tableInfo.rows.forEach(column => {
            console.log(`  - ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : '(NULL)'} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
        });
        
        process.exit(0);
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('✅ Колонка points уже существует');
        } else {
            console.error('❌ Ошибка:', error);
        }
        process.exit(1);
    }
}

addPointsColumn();