const axios = require('axios');
const bcrypt = require('bcryptjs');

async function testAchievementNotification() {
  try {
    console.log('🧪 Тестирование уведомлений о достижениях...');

    // Получаем токен для админа
    const adminLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });

    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Авторизация админа успешна');

    // Присваиваем достижение пользователю
    const achievementResponse = await axios.post('http://localhost:5000/api/achievements/1/award/2', {}, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('✅ Достижение присвоено:', achievementResponse.data);

    // Проверяем уведомления пользователя
    const userLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'ivanov',
      password: 'student123'
    });

    const userToken = userLoginResponse.data.token;

    const notificationsResponse = await axios.get('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    console.log('📬 Уведомления пользователя:');
    notificationsResponse.data.notifications.slice(0, 5).forEach(notification => {
      console.log(`- ${notification.type}: ${notification.title}`);
      console.log(`  ${notification.message}`);
    });

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.response?.data || error.message);
  }
}

async function testEventConfirmationNotification() {
  try {
    console.log('🧪 Тестирование уведомлений о подтверждении участия...');

    // Получаем токен для админа
    const adminLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });

    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Авторизация админа успешна');

    // Подтверждаем участие в мероприятии
    const confirmResponse = await axios.post('http://localhost:5000/api/admin/events/1/confirm/2', {}, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('✅ Участие подтверждено:', confirmResponse.data);

    // Проверяем уведомления пользователя
    const userLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'ivanov',
      password: 'student123'
    });

    const userToken = userLoginResponse.data.token;

    const notificationsResponse = await axios.get('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    console.log('📬 Уведомления пользователя после подтверждения:');
    notificationsResponse.data.notifications.slice(0, 5).forEach(notification => {
      console.log(`- ${notification.type}: ${notification.title}`);
      console.log(`  ${notification.message}`);
    });

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.response?.data || error.message);
  }
}

// Запускаем тесты
async function runTests() {
  await testAchievementNotification();
  console.log('\n' + '='.repeat(50) + '\n');
  await testEventConfirmationNotification();
}

runTests();