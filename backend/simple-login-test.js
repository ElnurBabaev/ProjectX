#!/usr/bin/env node

/**
 * Простой тест API авторизации
 */

const https = require('https');
const http = require('http');

async function testLogin() {
  try {
    console.log('🧪 Тестирую авторизацию...');
    
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
        'Content-Length': loginData.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        console.log(`Статус: ${res.statusCode}`);
        console.log(`Заголовки: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`Ответ: ${data}`);
          resolve(data);
        });
      });

      req.on('error', (err) => {
        console.error(`Ошибка запроса: ${err.message}`);
        reject(err);
      });

      req.write(loginData);
      req.end();
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

testLogin();