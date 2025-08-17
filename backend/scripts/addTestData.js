require('dotenv').config();
const { Event, Product } = require('../models');

async function addMoreTestData() {
  console.log('Добавление дополнительных тестовых данных...');

  // Добавляем современные мероприятия с актуальными датами
  const newEvents = [
    {
      title: 'Хакатон по программированию',
      description: 'Соревнования по созданию IT-решений среди школьников',
      date: '2025-09-15 10:00:00',
      location: 'Компьютерный класс',
      maxParticipants: 30,
      pointsReward: 40,
      imageUrl: 'https://via.placeholder.com/400x300/4F46E5/ffffff?text=Hackathon'
    },
    {
      title: 'Школьная ярмарка талантов',
      description: 'Выставка творческих работ и выступлений учеников',
      date: '2025-09-20 15:00:00',
      location: 'Актовый зал',
      maxParticipants: 150,
      pointsReward: 25,
      imageUrl: 'https://via.placeholder.com/400x300/10B981/ffffff?text=Talents'
    },
    {
      title: 'Дебаты старшеклассников',
      description: 'Интеллектуальная битва на актуальные темы',
      date: '2025-09-25 14:30:00',
      location: 'Аудитория 201',
      maxParticipants: 40,
      pointsReward: 35,
      imageUrl: 'https://via.placeholder.com/400x300/F59E0B/ffffff?text=Debate'
    },
    {
      title: 'Эко-квест',
      description: 'Экологическая игра на территории школы',
      date: '2025-09-30 12:00:00',
      location: 'Школьный двор',
      maxParticipants: 60,
      pointsReward: 30,
      imageUrl: 'https://via.placeholder.com/400x300/059669/ffffff?text=EcoQuest'
    },
    {
      title: 'Кулинарный мастер-класс',
      description: 'Готовим вкусные и полезные блюда вместе',
      date: '2025-10-05 16:00:00',
      location: 'Столовая',
      maxParticipants: 20,
      pointsReward: 20,
      imageUrl: 'https://via.placeholder.com/400x300/EF4444/ffffff?text=Cooking'
    },
    {
      title: 'Космическая викторина',
      description: 'Увлекательные вопросы о космосе и астрономии',
      date: '2025-10-10 13:00:00',
      location: 'Кабинет физики',
      maxParticipants: 35,
      pointsReward: 25,
      imageUrl: 'https://via.placeholder.com/400x300/8B5CF6/ffffff?text=Space'
    }
  ];

  // Добавляем современные товары
  const newProducts = [
    {
      name: 'Толстовка с капюшоном',
      description: 'Удобная толстовка с современным дизайном школы',
      price: 80,
      imageUrl: 'https://via.placeholder.com/300x300/6366F1/ffffff?text=Hoodie',
      stock: 25,
      category: 'clothing'
    },
    {
      name: 'Стикер-пак школьника',
      description: 'Набор крутых стикеров для украшения гаджетов',
      price: 20,
      imageUrl: 'https://via.placeholder.com/300x300/EC4899/ffffff?text=Stickers',
      stock: 100,
      category: 'accessories'
    },
    {
      name: 'Термокружка',
      description: 'Стильная термокружка для горячих напитков',
      price: 45,
      imageUrl: 'https://via.placeholder.com/300x300/F97316/ffffff?text=Thermo',
      stock: 18,
      category: 'accessories'
    },
    {
      name: 'Набор цветных ручек',
      description: 'Яркие гелевые ручки для творческих заданий',
      price: 25,
      imageUrl: 'https://via.placeholder.com/300x300/14B8A6/ffffff?text=Pens',
      stock: 40,
      category: 'stationery'
    },
    {
      name: 'Планер школьника',
      description: 'Стильный планер для организации учебы и дел',
      price: 35,
      imageUrl: 'https://via.placeholder.com/300x300/3B82F6/ffffff?text=Planner',
      stock: 30,
      category: 'stationery'
    },
    {
      name: 'Значок "Отличник"',
      description: 'Эксклюзивный значок для лучших учеников',
      price: 40,
      imageUrl: 'https://via.placeholder.com/300x300/DC2626/ffffff?text=Badge',
      stock: 15,
      category: 'accessories'
    },
    {
      name: 'USB-флешка школьная',
      description: '16GB флешка с символикой школы',
      price: 60,
      imageUrl: 'https://via.placeholder.com/300x300/7C3AED/ffffff?text=USB',
      stock: 22,
      category: 'tech'
    },
    {
      name: 'Тетрадь премиум',
      description: 'Качественная тетрадь в твердой обложке',
      price: 18,
      imageUrl: 'https://via.placeholder.com/300x300/059669/ffffff?text=Notebook',
      stock: 60,
      category: 'stationery'
    }
  ];

  try {
    // Добавляем мероприятия
    for (const event of newEvents) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO events (title, description, date, location, maxParticipants, points, imageUrl)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [event.title, event.description, event.date, event.location, event.maxParticipants, event.points, event.imageUrl], function(err) {
          if (err) reject(err);
          else {
            console.log(`✅ Добавлено мероприятие: ${event.title}`);
            resolve();
          }
        });
      });
    }

    // Добавляем товары
    for (const product of newProducts) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO products (name, description, price, imageUrl, stock, category)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [product.name, product.description, product.price, product.imageUrl, product.stock, product.category], function(err) {
          if (err) reject(err);
          else {
            console.log(`✅ Добавлен товар: ${product.name}`);
            resolve();
          }
        });
      });
    }

    console.log('\n🎉 Все дополнительные данные успешно добавлены!');
    console.log(`📅 Добавлено ${newEvents.length} новых мероприятий`);
    console.log(`🛍️ Добавлено ${newProducts.length} новых товаров`);

  } catch (error) {
    console.error('Ошибка при добавлении данных:', error);
  } finally {
    db.close(() => {
      console.log('База данных закрыта');
    });
  }
}

addMoreTestData();