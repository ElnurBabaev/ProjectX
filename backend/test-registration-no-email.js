// Тест регистрации без email
async function testRegistrationNoEmail() {
    try {
        console.log('🧪 Тестирование регистрации без email...');
        
        const userData = {
            username: 'testuser' + Date.now(),
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

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Ошибка регистрации:', response.status, errorText);
            return;
        }

        const data = await response.json();
        console.log('✅ Регистрация успешна без email!');
        console.log('👤 Пользователь:', data.user.username);
        console.log('🔑 Токен получен:', !!data.token);

    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
    }
}

testRegistrationNoEmail();