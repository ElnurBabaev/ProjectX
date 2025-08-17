const http = require('http');
const fs = require('fs');
const FormData = require('form-data');

async function testImageUpload() {
  try {
    // Сначала авторизуемся
    console.log('🔑 Получаем токен...');
    const token = await getAuthToken();
    
    if (!token) {
      console.log('❌ Не удалось получить токен');
      return;
    }

    console.log('✅ Токен получен, тестируем загрузку изображения...');

    // Создаем тестовое изображение (простой SVG)
    const testImage = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e3f2fd"/>
      <circle cx="100" cy="100" r="50" fill="#1976d2"/>
      <text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="16" fill="white">ТЕСТ</text>
    </svg>`;
    
    fs.writeFileSync('test-image.svg', testImage);
    
    // Отправляем файл
    const form = new FormData();
    form.append('image', fs.createReadStream('test-image.svg'));
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/upload/upload-image',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Статус: ${res.statusCode}`);
      
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Ответ API:', JSON.stringify(response, null, 2));
          
          if (response.imageUrl) {
            console.log('✅ Изображение успешно загружено!');
            console.log('🖼️  URL изображения:', `http://localhost:5000${response.imageUrl}`);
          }
        } catch (e) {
          console.log('❌ Ошибка парсинга JSON:', data);
        }
        
        // Удаляем тестовый файл
        fs.unlinkSync('test-image.svg');
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Ошибка запроса: ${e.message}`);
    });

    form.pipe(req);
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

async function getAuthToken() {
  return new Promise((resolve, reject) => {
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
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.token);
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

testImageUpload();