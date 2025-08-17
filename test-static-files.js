#!/usr/bin/env node

/**
 * Тест доступности статических файлов (изображений)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

async function testStaticFiles() {
  try {
    console.log('🖼️ Тестирую доступность статических изображений...');
    
    // Получаем список файлов в папке uploads
    const uploadsPath = path.join(__dirname, 'backend', 'uploads');
    const files = fs.readdirSync(uploadsPath);
    
    console.log(`📁 Найдено файлов в uploads: ${files.length}`);
    
    if (files.length === 0) {
      console.log('❌ Нет файлов для тестирования');
      return;
    }
    
    // Тестируем первые 3 файла
    const testFiles = files.slice(0, 3);
    
    for (const filename of testFiles) {
      console.log(`\n🔍 Тестирую файл: ${filename}`);
      
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: `/uploads/${filename}`,
        method: 'GET'
      };

      try {
        const result = await new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            console.log(`📊 Статус: ${res.statusCode}`);
            console.log(`📋 Content-Type: ${res.headers['content-type']}`);
            console.log(`📏 Content-Length: ${res.headers['content-length']}`);
            
            if (res.statusCode === 200) {
              console.log('✅ Файл доступен!');
            } else {
              console.log('❌ Файл недоступен');
            }
            
            resolve({ status: res.statusCode, headers: res.headers });
          });

          req.on('error', (err) => {
            console.log(`💥 Ошибка запроса: ${err.message}`);
            reject(err);
          });

          req.end();
        });
      } catch (error) {
        console.log(`❌ Ошибка для файла ${filename}: ${error.message}`);
      }
    }
    
    // Проверим также правильность CORS заголовков
    console.log('\n🌐 Проверяю CORS заголовки...');
    const corsOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `/uploads/${testFiles[0]}`,
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    };

    try {
      await new Promise((resolve, reject) => {
        const req = http.request(corsOptions, (res) => {
          console.log(`🔒 Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
          console.log(`🔒 Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
          
          if (res.headers['access-control-allow-origin']) {
            console.log('✅ CORS настроен правильно');
          } else {
            console.log('❌ CORS не настроен!');
          }
          
          resolve();
        });

        req.on('error', reject);
        req.end();
      });
    } catch (error) {
      console.log(`❌ Ошибка проверки CORS: ${error.message}`);
    }
    
  } catch (error) {
    console.error('💥 Общая ошибка:', error.message);
  }
}

testStaticFiles();