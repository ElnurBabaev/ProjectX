const http = require('http');
const fs = require('fs');
const FormData = require('form-data');

async function createAndUploadTestImage() {
  try {
    console.log('🎨 Создаем тестовое изображение...');
    
    // Создаем простое SVG изображение
    const testSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f9ff"/>
      <rect x="50" y="50" width="300" height="200" fill="#1e40af" rx="10"/>
      <text x="200" y="130" text-anchor="middle" font-family="Arial" font-size="24" fill="white">ТЕСТОВОЕ</text>
      <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="24" fill="white">ИЗОБРАЖЕНИЕ</text>
      <text x="200" y="200" text-anchor="middle" font-family="Arial" font-size="16" fill="#93c5fd">Загружено через API</text>
    </svg>`;
    
    fs.writeFileSync('test-event-image.svg', testSvg);
    
    console.log('🔑 Получаем токен авторизации...');
    const token = await getAuthToken();
    
    if (!token) {
      console.log('❌ Не удалось получить токен');
      return;
    }
    
    console.log('📤 Загружаем изображение на сервер...');
    
    // Загружаем файл
    const form = new FormData();
    form.append('image', fs.createReadStream('test-event-image.svg'));
    
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
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Изображение успешно загружено!');
          console.log('🖼️  URL:', `http://localhost:5000${response.imageUrl}`);
          console.log('📂 Путь для БД:', response.imageUrl);
          console.log('📏 Размер:', response.size, 'байт');
        } catch (e) {
          console.log('❌ Ошибка:', data);
        }
        
        // Удаляем временный файл
        fs.unlinkSync('test-event-image.svg');
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Ошибка загрузки: ${e.message}`);
      fs.unlinkSync('test-event-image.svg');
    });

    form.pipe(req);
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

async function getAuthToken() {
  return new Promise((resolve) => {
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
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.token);
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(loginData);
    req.end();
  });
}

createAndUploadTestImage();