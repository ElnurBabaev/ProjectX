const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Тестируем API маршруты для назначения достижений и подтверждения участия

async function testAchievementAssignment() {
  console.log('🧪 Тестируем назначение достижений...');
  
  try {
    // Сначала получаем токен администратора (предполагаем, что admin/admin существует)
    console.log('🔐 Получаем токен администратора...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        login: 'admin',
        password: 'admin'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Ошибка входа:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Токен получен');
    
    // Получаем список достижений
    console.log('📋 Получаем список достижений...');
    const achievementsResponse = await fetch('http://localhost:5000/api/achievements', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!achievementsResponse.ok) {
      console.error('❌ Ошибка получения достижений:', await achievementsResponse.text());
      return;
    }
    
    const achievementsData = await achievementsResponse.json();
    console.log(`📊 Найдено достижений: ${achievementsData.achievements?.length || 0}`);
    
    if (achievementsData.achievements && achievementsData.achievements.length > 0) {
      const firstAchievement = achievementsData.achievements[0];
      console.log(`🎯 Первое достижение: ${firstAchievement.title} (ID: ${firstAchievement.id})`);
      
      // Получаем список пользователей
      console.log('👥 Получаем список пользователей...');
      const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!usersResponse.ok) {
        console.error('❌ Ошибка получения пользователей:', await usersResponse.text());
        return;
      }
      
      const usersData = await usersResponse.json();
      console.log(`👥 Найдено пользователей: ${usersData.users?.length || 0}`);
      
      if (usersData.users && usersData.users.length > 0) {
        // Ищем пользователя-студента (не админа)
        const student = usersData.users.find(u => u.role === 'student');
        if (student) {
          console.log(`👤 Студент для теста: ${student.first_name} ${student.last_name} (ID: ${student.id})`);
          
          // Проверяем маршрут для получения пользователей с достижением
          console.log('🔍 Проверяем маршрут получения пользователей с достижением...');
          const achievementUsersResponse = await fetch(`http://localhost:5000/api/admin/achievements/${firstAchievement.id}/users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (achievementUsersResponse.ok) {
            const achievementUsersData = await achievementUsersResponse.json();
            console.log(`✅ Маршрут работает. Пользователей с достижением: ${achievementUsersData.users?.length || 0}`);
          } else {
            console.error('❌ Ошибка получения пользователей достижения:', await achievementUsersResponse.text());
          }
        } else {
          console.log('⚠️ Не найдено пользователей-студентов для теста');
        }
      }
    }
    
    // Тестируем маршруты событий
    console.log('\n🎪 Тестируем маршруты событий...');
    const eventsResponse = await fetch('http://localhost:5000/api/events', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log(`📅 Найдено событий: ${eventsData.events?.length || 0}`);
      
      if (eventsData.events && eventsData.events.length > 0) {
        const firstEvent = eventsData.events[0];
        console.log(`🎭 Первое событие: ${firstEvent.title} (ID: ${firstEvent.id}, баллы: ${firstEvent.points || 0})`);
        
        // Проверяем маршрут получения участников события
        console.log('👥 Проверяем получение участников события...');
        const participantsResponse = await fetch(`http://localhost:5000/api/admin/events/${firstEvent.id}/participants`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          console.log(`✅ Маршрут работает. Участников: ${participantsData.participants?.length || 0}`);
        } else {
          console.error('❌ Ошибка получения участников:', await participantsResponse.text());
        }
      }
    } else {
      console.error('❌ Ошибка получения событий:', await eventsResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Ошибка в тестировании:', error);
  }
}

// Запускаем тест
testAchievementAssignment().then(() => {
  console.log('\n🎉 Тестирование завершено!');
});