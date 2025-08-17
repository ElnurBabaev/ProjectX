const http = require('http');

// Сначала получаем новый токен
const loginData = JSON.stringify({
  login: 'admin',
  password: 'admin'
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

console.log('🔑 Получаем новый токен...');

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.token) {
        console.log('✅ Токен получен');
        testStats(response.token);
      } else {
        console.log('❌ Ошибка получения токена:', data);
      }
    } catch (e) {
      console.log('❌ Ошибка парсинга ответа авторизации:', data);
    }
  });
});

loginReq.on('error', (e) => {
  console.error(`❌ Ошибка авторизации: ${e.message}`);
});

loginReq.write(loginData);
loginReq.end();

function testStats(token) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/statistics',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  console.log('🔍 Тестируем API статистики...');

  const req = http.request(options, (res) => {
    console.log(`Статус: ${res.statusCode}`);
    
    let data = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Ответ API:');
      try {
        const response = JSON.parse(data);
        console.log(JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Ошибка парсинга JSON:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Ошибка запроса: ${e.message}`);
  });

  req.end();
}