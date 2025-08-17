#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

async function testExportDirect() {
  try {
    // Используем токен из предыдущего теста
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc1NTQ3MDc1OCwiZXhwIjoxNzU2MDc1NTU4fQ.5I3CjFUm9xj0CEscUK5TvOP4kwTcqPb4kILjQMnpGgM';
    
    console.log('🧪 Тестирую экспорт Excel с токеном...');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/events/5/export-participants',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        console.log(`📊 Статус: ${res.statusCode}`);
        console.log(`📋 Заголовки:`, res.headers);
        
        if (res.statusCode !== 200) {
          let errorData = '';
          res.on('data', chunk => errorData += chunk);
          res.on('end', () => {
            console.log(`❌ Ошибка: ${errorData}`);
            reject(new Error(`Ошибка ${res.statusCode}: ${errorData}`));
          });
          return;
        }
        
        const chunks = [];
        let totalSize = 0;
        
        res.on('data', chunk => {
          chunks.push(chunk);
          totalSize += chunk.length;
        });
        
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`📦 Получен файл размером: ${buffer.length} байт`);
          
          // Сохраняем файл
          const fileName = 'test-participants-export.xlsx';
          fs.writeFileSync(fileName, buffer);
          console.log(`💾 Файл сохранён как: ${fileName}`);
          console.log('✅ Экспорт успешен!');
          resolve(buffer);
        });
      });

      req.on('error', (err) => {
        console.error(`❌ Ошибка запроса: ${err.message}`);
        reject(err);
      });

      req.end();
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testExportDirect();