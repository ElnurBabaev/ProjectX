const db = require('./config/database');

async function checkUserAchievements() {
    try {
        // Проверяем структуру таблицы user_achievements
        const tableInfo = await db.query('PRAGMA table_info(user_achievements)');
        console.log('📋 Структура таблицы user_achievements:');
        tableInfo.rows.forEach(column => {
            console.log(`  - ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : '(NULL)'} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
        });
        
        // Проверяем структуру таблицы achievements  
        const achievementsInfo = await db.query('PRAGMA table_info(achievements)');
        console.log('\n📋 Структура таблицы achievements:');
        achievementsInfo.rows.forEach(column => {
            console.log(`  - ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : '(NULL)'} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
        });
        
        // Проверяем пример записи
        const sampleAchievement = await db.query('SELECT * FROM achievements LIMIT 1');
        console.log('\n🏆 Пример достижения:');
        console.log(JSON.stringify(sampleAchievement.rows[0], null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

checkUserAchievements();