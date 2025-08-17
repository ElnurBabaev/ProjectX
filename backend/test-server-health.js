// Проверка доступности сервера
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const postData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
});

console.log('🔍 Проверка доступности сервера...');

const req = http.request(options, (res) => {
    console.log('✅ Сервер доступен! Статус:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('📄 Ответ:', data);
    });
});

req.on('error', (error) => {
    console.error('❌ Сервер недоступен:', error.message);
});

req.write(postData);
req.end();