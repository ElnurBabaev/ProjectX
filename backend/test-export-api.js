#!/usr/bin/env node

/**
 * Тест API эндпоинта экспорта участников в Excel
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

async function testExportAPI() {
  try {
    console.log('🧪 Тестирую API эндпоинт экспорта Excel...');
    
    // Сначала получаем токен администратора
    const loginData = JSON.stringify({
      login: 'admin',
      password: 'admin123'
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    console.log('🔑 Авторизуюсь как администратор...');
    
    const token = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.token) {
              console.log('✅ Авторизация успешна');
              resolve(response.token);
            } else {
              reject(new Error('Не удалось получить токен: ' + data));
            }
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    // Теперь тестируем эндпоинт экспорта
    const exportOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/events/5/export-participants', // ID созданного тестового события
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('📊 Запрашиваю экспорт участников события ID 5...');

    const exportData = await new Promise((resolve, reject) => {
      const req = http.request(exportOptions, (res) => {
        console.log(`📡 Статус ответа: ${res.statusCode}`);
        console.log('📋 Заголовки ответа:', res.headers);

        if (res.statusCode !== 200) {
          let errorData = '';
          res.on('data', chunk => errorData += chunk);
          res.on('end', () => {
            reject(new Error(`API вернул ошибку ${res.statusCode}: ${errorData}`));
          });
          return;
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`📦 Получен файл размером: ${buffer.length} байт`);
          resolve(buffer);
        });
      });

      req.on('error', reject);
      req.end();
    });

    // Сохраняем файл для проверки
    const testFileName = path.join(__dirname, 'test-export.xlsx');
    fs.writeFileSync(testFileName, exportData);
    console.log(`💾 Файл сохранён как: ${testFileName}`);
    console.log('✅ Тест API эндпоинта экспорта прошёл успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.message);
    process.exit(1);
  }
}

testExportAPI();