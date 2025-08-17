async function testUsersAPI() {
  console.log('🔍 Тестируем GET /admin/users API...\n');
  
  try {
    // Сначала логинимся чтобы получить токен
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'admin', password: 'admin123' })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    if (!token) {
      console.error('❌ Не удалось получить токен');
      return;
    }
    
    console.log('✅ Успешно получен токен авторизации');
    
    // Теперь получаем список пользователей
    const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      console.error(`❌ Ошибка API: ${usersResponse.status} ${usersResponse.statusText}`);
      return;
    }
    
    const usersData = await usersResponse.json();
    
    console.log('📤 Ответ API пользователей:');
    console.log(JSON.stringify(usersData, null, 2));
    
    if (usersData.users && usersData.users.length > 0) {
      const firstUser = usersData.users[0];
      console.log('\n🎯 Проверяем первого пользователя:');
      console.log(`ID: ${firstUser.id}`);
      console.log(`Логин: ${firstUser.login}`);
      console.log(`Имя: ${firstUser.first_name} ${firstUser.last_name}`);
      console.log(`Класс: ${firstUser.class_grade}${firstUser.class_letter}`);
      console.log(`Роль: ${firstUser.role}`);
      console.log(`Баллы: ${firstUser.points} (тип: ${typeof firstUser.points})`);
      console.log(`Дата создания: ${firstUser.created_at}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования API:', error.message);
  }
}

testUsersAPI();