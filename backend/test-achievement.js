// Тест создания достижения
async function testCreateAchievement() {
    try {
        console.log('🧪 Тестирование создания достижения...');
        
        // Сначала авторизуемся
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Авторизация успешна, получен токен');

        // Теперь создаем достижение
        const achievementResponse = await fetch('http://localhost:5000/api/achievements', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Тестовое достижение',
                description: 'Описание тестового достижения',
                icon: '🏆',
                type: 'excellence',
                points: 50,
                badge_color: '#FFD700'
            })
        });

        if (!achievementResponse.ok) {
            const errorData = await achievementResponse.text();
            throw new Error(`HTTP ${achievementResponse.status}: ${errorData}`);
        }

        const achievementData = await achievementResponse.json();
        console.log('✅ Достижение создано успешно!');
        console.log('📋 Данные достижения:', achievementData);

        // Получим список всех достижений
        const allAchievementsResponse = await fetch('http://localhost:5000/api/achievements', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const allAchievementsData = await allAchievementsResponse.json();
        console.log('📊 Всего достижений:', allAchievementsData.achievements.length);
        console.log('🔍 Последнее достижение:', allAchievementsData.achievements[0]);

    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
    }
}

testCreateAchievement();
}
}

testCreateAchievement();