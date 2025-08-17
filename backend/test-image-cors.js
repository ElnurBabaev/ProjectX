const fetch = require('node-fetch');

// Тестируем доступность изображения с CORS заголовками
async function testImageCORS() {
    try {
        console.log('Тестируем доступность изображения...');
        
        // Тестируем конкретное изображение из лога
        const imageUrl = 'http://localhost:5000/uploads/image-1754668703854-661224000.jpg';
        
        console.log('Запрашиваем:', imageUrl);
        
        const response = await fetch(imageUrl, {
            method: 'GET',
            headers: {
                'Origin': 'http://localhost:3000', // Симулируем запрос с фронтенда
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:');
        response.headers.forEach((value, key) => {
            console.log(`  ${key}: ${value}`);
        });
        
        if (response.ok) {
            console.log('✅ Изображение доступно!');
            const contentLength = response.headers.get('content-length');
            console.log(`Размер файла: ${contentLength} байт`);
        } else {
            console.log('❌ Ошибка доступа к изображению');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
    }
}

testImageCORS();