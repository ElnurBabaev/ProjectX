const db = require('./config/database.js');

async function testProfileAPI() {
  try {
    console.log('🔍 Тестируем GET /auth/profile API...\n');
    
    // Имитируем запрос как в роуте auth.js
    const userId = 1; // admin
    
    const result = await db.query(
      'SELECT id, login, first_name, last_name, class_grade, class_letter, role, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    const user = result.rows[0];
    console.log('📋 Сырые данные из базы:');
    console.log(user);
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }

    // Получаем количество достижений пользователя
    const achievementsResult = await db.query(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?',
      [user.id]
    );
    
    const achievementsCount = achievementsResult.rows[0].count;

    // Получаем количество событий, в которых участвовал пользователь
    const eventsResult = await db.query(
      'SELECT COUNT(*) as count FROM event_registrations WHERE user_id = ?',
      [user.id]
    );
    
    const eventsCount = eventsResult.rows[0].count;

    const apiResponse = {
      user: {
        id: user.id,
        login: user.login,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name} ${user.last_name}`,
        class: `${user.class_grade}${user.class_letter}`,
        class_grade: user.class_grade,
        class_letter: user.class_letter,
        role: user.role,
        isAdmin: user.role === 'admin',
        avatar_url: user.avatar_url,
        achievements_count: achievementsCount,
        events_count: eventsCount,
        created_at: user.created_at
      }
    };
    
    console.log('\n📤 Ответ API:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n🎯 Проверяем avatar_url:');
    console.log(`DB avatar_url: "${user.avatar_url}"`);
    console.log(`API avatar_url: "${apiResponse.user.avatar_url}"`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
  
  process.exit(0);
}

testProfileAPI();