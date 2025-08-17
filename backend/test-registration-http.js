// Подробный тест регистрации с диагностикой
const http = require('http');

function testRegistrationHTTP() {
    const postData = JSON.stringify({
        username: 'testuser' + Date.now(),
        password: 'testpass123',
        full_name: 'Тест Пользователь',
        class: '9А'
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('🧪 Тестирование регистрации через HTTP...');
    console.log('📝 Данные:', postData);

    const req = http.request(options, (res) => {
        console.log('📊 Статус ответа:', res.statusCode);
        console.log('📋 Заголовки:', res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('📄 Ответ сервера:', data);
            if (res.statusCode === 201) {
                console.log('✅ Регистрация успешна!');
            } else {
                console.log('❌ Ошибка регистрации');
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Ошибка запроса:', error.message);
    });

    req.write(postData);
    req.end();
}

testRegistrationHTTP();