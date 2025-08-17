async function testLoginPoints() {
  try {
    console.log('🔐 Тестируем баллы в API логина...\n');

    // Логинимся
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'admin', password: 'admin123' })
    });
    
    const loginData = await loginResponse.json();
    console.log('📤 Ответ логина:');
    console.log(JSON.stringify(loginData, null, 2));
    
    if (loginData.user) {
      console.log('\n🎯 Баллы в логине:');
      console.log(`- Значение: ${loginData.user.points}`);
      console.log(`- Тип: ${typeof loginData.user.points}`);
      console.log(`- Существует поле: ${'points' in loginData.user}`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testLoginPoints();