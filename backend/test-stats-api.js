const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/statistics',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibG9naW4iOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNDQ2MTMxMSwiZXhwIjoxNzM0NTQ3NzExfQ.9rKZH3vE8Qsz-Wg4qr5_q9eYXt5LsHJJH9nIQq8zZxE'
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