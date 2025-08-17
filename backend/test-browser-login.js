#!/usr/bin/env node

/**
 * Полный тест логина как в браузере
 */

const http = require('http');

async function testBrowserLikeLogin() {
  try {
    console.log('🌐 Тестирую логин как в браузере...');
    
    const loginData = JSON.stringify({
      login: 'admin',
      password: 'admin'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length,
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Connection': 'keep-alive'
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        console.log(`📊 Статус: ${res.statusCode}`);
        console.log(`📋 Заголовки ответа:`);
        Object.entries(res.headers).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
        
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', (err) => {
        console.error(`❌ Ошибка запроса: ${err.message}`);
        reject(err);
      });

      console.log('📤 Отправляю запрос...');
      console.log('📦 Данные:', loginData);
      req.write(loginData);
      req.end();
    });
        
    console.log(`\n📥 Ответ сервера:`);
    console.log(response.data);
    
    if (response.status === 200) {
      console.log('\n✅ Логин успешен!');
      const result = JSON.parse(response.data);
      if (result.token) {
        console.log(`🎟️ Токен получен: ${result.token.substring(0, 30)}...`);
        
        // Теперь проверим получение профиля
        console.log('\n🔍 Проверяю получение профиля...');
        await testProfile(result.token);
      }
    } else {
      console.log(`\n❌ Логин неудачен. Код: ${response.status}`);
    }
    
  } catch (error) {
    console.error('💥 Общая ошибка:', error.message);
  }
}

async function testProfile(token) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Origin': 'http://localhost:3000',
      'Accept': 'application/json, text/plain, */*'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`📊 Статус профиля: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📥 Данные профиля: ${data.substring(0, 200)}...`);
        if (res.statusCode === 200) {
          console.log('✅ Профиль получен успешно!');
        } else {
          console.log(`❌ Ошибка получения профиля: ${res.statusCode}`);
        }
        resolve(data);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

testBrowserLikeLogin();