// Простой тест авторизации
const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log('🧪 Тестирование авторизации...');
        
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });

        const text = await response.text();
        console.log('📄 Ответ сервера:', text);
        
        if (response.ok) {
            const data = JSON.parse(text);
            console.log('✅ Авторизация успешна!');
            console.log('👤 Пользователь:', data.user.username);
            console.log('🔑 Токен получен:', !!data.token);
        } else {
            console.log('❌ Ошибка авторизации:', response.status);
        }
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
    }
}

testLogin();