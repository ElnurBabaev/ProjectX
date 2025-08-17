#!/usr/bin/env node

/**
 * Тест авторизации через curl
 */

const http = require('http');

async function testLogin() {
  try {
    console.log('🧪 Тестирую авторизацию с различными паролями...');
    
    const passwords = ['admin123', 'admin', 'password'];
    
    for (const password of passwords) {
      console.log(`\n🔑 Пробую пароль: "${password}"`);
      
      const loginData = JSON.stringify({
        login: 'admin',
        password: password
      });

      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': loginData.length,
          'Origin': 'http://localhost:3000'
        }
      };

      try {
        const response = await new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => {
              data += chunk;
            });
            
            res.on('end', () => {
              resolve({
                status: res.statusCode,
                data: data
              });
            });
          });

          req.on('error', reject);
          req.write(loginData);
          req.end();
        });
        
        console.log(`📊 Статус: ${response.status}`);
        
        if (response.status === 200) {
          console.log('✅ УСПЕХ! Правильный пароль найден');
          const result = JSON.parse(response.data);
          console.log(`🎯 Токен: ${result.token.substring(0, 20)}...`);
          break;
        } else {
          console.log(`❌ Ошибка: ${response.data}`);
        }
      } catch (error) {
        console.log(`💥 Ошибка запроса: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Общая ошибка:', error);
  }
}

testLogin();