const http = require('http');

// Проверяем доступность статических файлов
async function testImageAccess() {
  console.log('🔍 Тестируем доступность статических изображений...');
  
  // Проверяем доступ к загруженному изображению
  const imageUrl = 'http://localhost:5000/uploads/image-1755460474056-562858641.jpg';
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/uploads/image-1755460474056-562858641.jpg',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Статус: ${res.statusCode}`);
    console.log('Заголовки:', JSON.stringify(res.headers, null, 2));
    
    if (res.statusCode === 200) {
      console.log('✅ Изображение доступно!');
      console.log(`📍 URL: ${imageUrl}`);
    } else {
      console.log('❌ Изображение недоступно');
    }
  });

  req.on('error', (e) => {
    console.error(`❌ Ошибка запроса: ${e.message}`);
  });

  req.end();
}

testImageAccess();