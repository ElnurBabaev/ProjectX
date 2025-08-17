const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.data) {
      requestOptions.headers['Content-Type'] = 'application/json';
      const postData = JSON.stringify(options.data);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ data: parsedData, status: res.statusCode });
          } else {
            reject({ response: { data: parsedData, status: res.statusCode } });
          }
        } catch (error) {
          reject({ message: 'Invalid JSON response', data });
        }
      });
    });

    req.on('error', (error) => {
      reject({ message: error.message });
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Тестирование API...\n');
  
  try {
    // 1. Health Check
    console.log('1. Health Check...');
    const health = await makeRequest(`${BASE_URL}/health`);
    console.log('✅ Health:', health.data.message);
    
    // 2. Login
    console.log('\n2. Тестирование логина...');
    const loginData = {
  login: 'admin',
      password: 'admin123'
    };
    
    const loginResponse = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      data: loginData
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    const token = loginResponse.data.token;
    
    // 3. Get Events
    console.log('\n3. Получение событий...');
    const eventsResponse = await makeRequest(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Events loaded:', Array.isArray(eventsResponse.data) ? eventsResponse.data.length : 'response received');
    
    // 4. Get Products
    console.log('\n4. Получение товаров...');
    const productsResponse = await makeRequest(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Products loaded:', Array.isArray(productsResponse.data) ? productsResponse.data.length : 'response received');
    
    // 5. Get Achievements
    console.log('\n5. Получение достижений...');
    const achievementsResponse = await makeRequest(`${BASE_URL}/achievements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Achievements loaded:', Array.isArray(achievementsResponse.data) ? achievementsResponse.data.length : 'response received');
    
    console.log('\n🎉 Все основные API endpoints работают!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testAPI();