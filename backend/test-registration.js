// Тест регистрации нового пользователя
async function testRegistration() {
    try {
        console.log('🧪 Тестирование регистрации пользователя...');
        
        const userData = {
            username: 'testuser' + Date.now(),
            email: `testuser${Date.now()}@school.local`,
            password: 'testpass123',
            full_name: 'Тест Пользователь',
            class: '9А'
        };

        console.log('📝 Данные для регистрации:', userData);

        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const responseText = await response.text();
        console.log('📄 Ответ сервера:', responseText);

        if (!response.ok) {
            console.log('❌ Ошибка регистрации:', response.status);
            try {
                const errorData = JSON.parse(responseText);
                console.log('📋 Детали ошибки:', errorData);
            } catch (e) {
                console.log('❌ Не удалось разобрать ошибку');
            }
            return;
        }

        const data = JSON.parse(responseText);
        console.log('✅ Регистрация успешна!');
        console.log('👤 Пользователь:', data.user.username);
        console.log('🔑 Токен получен:', !!data.token);

    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
    }
}

testRegistration();