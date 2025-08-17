const db = require('./config/database');

async function addTotalEarnedPoints() {
    try {
        // Добавляем колонку total_earned_points в таблицу users
        await db.query('ALTER TABLE users ADD COLUMN total_earned_points INTEGER DEFAULT 0');
        console.log('✅ Колонка total_earned_points добавлена в таблицу users');
        
        // Устанавливаем начальные значения для существующих пользователей
        // Пользователи с баллами получают те же значения в total_earned_points
        await db.query('UPDATE users SET total_earned_points = COALESCE(points, 0) WHERE points > 0');
        console.log('✅ Установлены начальные значения total_earned_points');
        
        // Проверяем результат
        const result = await db.query('SELECT login, points, total_earned_points FROM users');
        console.log('\n📋 Результат обновления:');
        result.rows.forEach(user => {
            console.log(`- ${user.login}: текущие ${user.points || 0}, заработано ${user.total_earned_points || 0}`);
        });
        
        process.exit(0);
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('✅ Колонка total_earned_points уже существует');
            
            // Просто покажем текущие данные
            const result = await db.query('SELECT login, points, total_earned_points FROM users');
            console.log('\n📋 Текущие данные:');
            result.rows.forEach(user => {
                console.log(`- ${user.login}: текущие ${user.points || 0}, заработано ${user.total_earned_points || 0}`);
            });
        } else {
            console.error('❌ Ошибка:', error);
        }
        process.exit(1);
    }
}

addTotalEarnedPoints();