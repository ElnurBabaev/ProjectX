const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

async function testAPI() {
  try {
    // Создаем тестовый токен для пользователя elnur1 (id: 11)
    const token = jwt.sign({ id: 11, login: 'elnur1' }, 'secret_jwt_key', { expiresIn: '1h' });
    
    console.log('Тестируем API recent-activity для пользователя elnur1...');
    
    const response = await fetch('http://localhost:5000/api/auth/recent-activity', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API работает!');
      console.log('Количество активностей:', data.activities.length);
      console.log('Последние активности:');
      data.activities.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.action_type}: ${activity.title} (+${activity.points} баллов) - ${activity.created_at}`);
      });
    } else {
      console.error('❌ Ошибка API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Ответ:', errorText);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testAPI();