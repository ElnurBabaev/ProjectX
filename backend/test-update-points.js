const axios = require('axios');

async function testUpdatePoints() {
    try {
        // Сначала логинимся чтобы получить токен
        console.log('🔐 Логинимся как admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            login: 'admin',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Токен получен');
        
        // Тестируем обновление баллов
        console.log('🎯 Тестируем обновление баллов пользователя ID=1...');
        const updateResponse = await axios.post('http://localhost:5000/api/admin/users/1/update-points', 
            { points: 50 }, 
            { headers: { 'Authorization': `Bearer ${token}` }}
        );
        
        console.log('📤 Ответ API обновления баллов:');
        console.log(JSON.stringify(updateResponse.data, null, 2));
        
        // Проверяем что баллы обновились
        console.log('👤 Проверяем пользователей...');
        const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const admin = usersResponse.data.users.find(u => u.id === 1);
        console.log('👑 Admin пользователь:');
        console.log(`  - ID: ${admin.id}`);
        console.log(`  - Логин: ${admin.login}`);
        console.log(`  - Баллы: ${admin.points}`);
        
    } catch (error) {
        console.error('❌ Ошибка:', error.response ? error.response.data : error.message);
    }
}

testUpdatePoints();