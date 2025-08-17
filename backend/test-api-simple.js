#!/usr/bin/env node

// Простой тест API без использования curl или внешних зависимостей
const http = require('http');

const testEndpoints = [
  { path: '/api/health', method: 'GET' },
  { path: '/api', method: 'GET' },
  { path: '/api/events', method: 'GET' },
  { path: '/api/products', method: 'GET' },
  { path: '/api/achievements', method: 'GET' }
];

function testAPI(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: endpoint.path,
      method: endpoint.method,
      timeout: 4000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          endpoint: endpoint.path,
          status: res.statusCode,
          success: res.statusCode < 400,
          data: data.substring(0, 100) + (data.length > 100 ? '...' : '')
        });
      });
    });

    req.on('error', () => {
      resolve({
        endpoint: endpoint.path,
        status: 'ERROR',
        success: false,
        data: 'Connection failed'
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint: endpoint.path,
        status: 'TIMEOUT',
        success: false,
        data: 'Request timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 ТЕСТИРОВАНИЕ API АРХИТЕКТУРЫ');
  console.log('================================');
  
  // Проверяем, запущен ли сервер
  console.log('🔍 Проверка доступности сервера на порту 5000...\n');
  
  for (const endpoint of testEndpoints) {
    const result = await testAPI(endpoint);
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${endpoint.method} ${result.endpoint}`);
    console.log(`   Статус: ${result.status}`);
    if (result.data && result.success) {
      console.log(`   Ответ: ${result.data}`);
    }
    console.log('');
  }

  // Дополнительная проверка: логин
  await new Promise((resolve) => {
  const payload = JSON.stringify({ login: 'admin', password: 'admin123' });
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        const ok = res.statusCode < 400;
        const icon = ok ? '✅' : '❌';
        console.log(`${icon} POST /api/auth/login`);
        console.log(`   Статус: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(body);
          console.log(`   Ответ: ${JSON.stringify({ message: parsed.message, hasToken: !!parsed.token, userLogin: parsed.user?.login })}`);
        } catch (e) {
          console.log(`   Тело: ${body.substring(0, 120)}`);
        }
        console.log('');
        resolve();
      });
    });
    req.on('error', (e) => {
      console.log(`❌ POST /api/auth/login`);
      console.log(`   Ошибка: ${e.message}`);
      console.log('');
      resolve();
    });
    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ POST /api/auth/login`);
      console.log('   Ошибка: timeout');
      console.log('');
      resolve();
    });
    req.write(payload);
    req.end();
  });
  
  console.log('🎯 ЗАКЛЮЧЕНИЕ:');
  const successCount = (await Promise.all(testEndpoints.map(testAPI)))
    .filter(r => r.success).length;
  
  if (successCount === testEndpoints.length) {
    console.log('✅ Все endpoints работают корректно!');
    console.log('🚀 Архитектура полностью исправлена и готова к использованию.');
  } else if (successCount === 0) {
    console.log('❌ Сервер не отвечает. Проверьте:');
    console.log('   1. Запущен ли сервер: node server-sqlite.js');
    console.log('   2. Доступен ли порт 5000');
  } else {
    console.log(`⚠️  Работает ${successCount}/${testEndpoints.length} endpoints`);
    console.log('🔧 Архитектура частично исправлена, требуется доработка.');
  }
}

runTests().catch(console.error);