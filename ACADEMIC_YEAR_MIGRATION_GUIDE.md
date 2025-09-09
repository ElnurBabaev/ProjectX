# ИНСТРУКЦИЯ ПО ВНЕДРЕНИЮ СИСТЕМЫ УЧЕБНЫХ ГОДОВ

> **⚠️ КРИТИЧЕСКИ ВАЖНО: Выполнять ТОЛЬКО в августе 2026 года!**
> 
> Данная инструкция предназначена для безопасного внедрения системы учебных годов в школьное приложение. Выполнение в августе минимизирует риски для активных пользователей.

---

## ОБЗОР СИСТЕМЫ

Система учебных годов позволит:
- Автоматически сбрасывать баллы каждое 1 сентября
- Сохранять историю достижений по учебным годам
- Показывать статистику: "Баллы в 2025-2026 учебном году"
- Отслеживать прогресс ученика по годам

---

## ЭТАП 1: ПОДГОТОВКА И АНАЛИЗ (1-2 августа)

### 1.1 Создание резервной копии
```bash
# Создать резервную копию базы данных
cd "/home/el/Рабочий стол/ProjectX/backend"
cp database.sqlite database_backup_academic_years_$(date +%Y%m%d_%H%M%S).sqlite

# Создать тестовую копию для экспериментов
cp database.sqlite test_database.sqlite
```

### 1.2 Анализ текущих данных
Создать файл: `scripts/analyzeCurrentData.js`
```javascript
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './test_database.sqlite'
});

async function analyzeData() {
  const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
  const [points] = await sequelize.query('SELECT SUM(points) as total FROM users WHERE points IS NOT NULL');
  const [events] = await sequelize.query('SELECT COUNT(*) as count FROM events');
  
  console.log('=== АНАЛИЗ ТЕКУЩИХ ДАННЫХ ===');
  console.log(`Пользователей: ${users[0].count}`);
  console.log(`Общая сумма баллов: ${points[0].total || 0}`);
  console.log(`Мероприятий: ${events[0].count}`);
  
  return {
    totalUsers: users[0].count,
    totalPoints: points[0].total || 0,
    totalEvents: events[0].count
  };
}

if (require.main === module) {
  analyzeData().then(data => {
    console.log('Анализ завершен:', data);
    process.exit(0);
  }).catch(err => {
    console.error('Ошибка анализа:', err);
    process.exit(1);
  });
}

module.exports = { analyzeData };
```

---

## ЭТАП 2: СОЗДАНИЕ НОВОЙ СТРУКТУРЫ БД (3-5 августа)

### 2.1 Создание модели AcademicYear
Создать файл: `models/AcademicYear.js`
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AcademicYear = sequelize.define('AcademicYear', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    academicYear: {
      type: DataTypes.STRING(9),
      allowNull: false,
      field: 'academic_year'
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_points'
    },
    eventsParticipated: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'events_participated'
    },
    achievementsEarned: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      field: 'achievements_earned',
      get() {
        const value = this.getDataValue('achievementsEarned');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('achievementsEarned', JSON.stringify(value || []));
      }
    },
    startDate: {
      type: DataTypes.DATEONLY,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      field: 'end_date'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'academic_years',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id', 'academic_year'],
        unique: true
      },
      {
        fields: ['academic_year']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  return AcademicYear;
};
```

### 2.2 Обновление models/index.js
Добавить в существующий файл `models/index.js`:
```javascript
// Добавить после существующих импортов
const AcademicYear = require('./AcademicYear')(sequelize);

// Добавить ассоциации (после существующих)
User.hasMany(AcademicYear, { foreignKey: 'userId', as: 'academicYears' });
AcademicYear.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Добавить в экспорт
module.exports = {
  sequelize,
  User,
  Product,
  AcademicYear, // НОВОЕ
};
```

### 2.3 Создание утилит для работы с учебными годами
Создать файл: `utils/academicYearUtils.js`
```javascript
/**
 * Определяет текущий учебный год на основе даты
 * @param {Date} date - Дата для определения учебного года
 * @returns {string} - Строка формата "YYYY-YYYY"
 */
function getAcademicYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-11 -> 1-12
  
  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Получает даты начала и конца учебного года
 * @param {string} academicYear - Строка формата "YYYY-YYYY"
 * @returns {object} - Объект с датами начала и конца
 */
function getAcademicYearDates(academicYear) {
  const [startYear, endYear] = academicYear.split('-').map(Number);
  
  return {
    startDate: new Date(startYear, 8, 1), // 1 сентября
    endDate: new Date(endYear, 7, 31)     // 31 августа
  };
}

/**
 * Проверяет, является ли учебный год активным
 * @param {string} academicYear - Строка формата "YYYY-YYYY"
 * @returns {boolean}
 */
function isAcademicYearActive(academicYear) {
  return academicYear === getAcademicYear();
}

module.exports = {
  getAcademicYear,
  getAcademicYearDates,
  isAcademicYearActive
};
```

---

## ЭТАП 3: СОЗДАНИЕ МИГРАЦИОННОГО СКРИПТА (6-10 августа)

### 3.1 Основной миграционный скрипт
Создать файл: `scripts/migrateToAcademicYears.js`
```javascript
const { User, AcademicYear, sequelize } = require('../models');
const { getAcademicYear, getAcademicYearDates } = require('../utils/academicYearUtils');

async function migrateToAcademicYears() {
  console.log('🚀 Начало миграции к системе учебных годов...');
  
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Создаем таблицу academic_years если её нет
    await AcademicYear.sync();
    console.log('✅ Таблица academic_years создана/проверена');
    
    // 2. Получаем всех пользователей
    const users = await User.findAll();
    console.log(`📊 Найдено пользователей: ${users.length}`);
    
    let migratedUsers = 0;
    let totalPointsMigrated = 0;
    
    // 3. Мигрируем данные каждого пользователя
    for (const user of users) {
      // Определяем учебный год для пользователя
      const userAcademicYear = determineUserAcademicYear(user);
      const { startDate, endDate } = getAcademicYearDates(userAcademicYear);
      
      // Подсчитываем статистику пользователя
      const userStats = await calculateUserStats(user.id);
      
      // Создаем запись в academic_years
      await AcademicYear.create({
        userId: user.id,
        academicYear: userAcademicYear,
        totalPoints: user.points || 0,
        eventsParticipated: userStats.eventsCount,
        achievementsEarned: userStats.achievements,
        startDate,
        endDate,
        isActive: userAcademicYear === getAcademicYear()
      }, { transaction });
      
      migratedUsers++;
      totalPointsMigrated += (user.points || 0);
      
      if (migratedUsers % 10 === 0) {
        console.log(`⏳ Обработано пользователей: ${migratedUsers}/${users.length}`);
      }
    }
    
    // 4. Валидация миграции
    await validateMigration();
    
    await transaction.commit();
    
    console.log('🎉 Миграция завершена успешно!');
    console.log(`✅ Мигрировано пользователей: ${migratedUsers}`);
    console.log(`✅ Мигрировано баллов: ${totalPointsMigrated}`);
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Ошибка миграции:', error);
    throw error;
  }
}

function determineUserAcademicYear(user) {
  // Если пользователь зарегистрировался до 1 сентября текущего года
  const registrationDate = new Date(user.createdAt);
  const currentSeptember = new Date(new Date().getFullYear(), 8, 1); // 1 сентября текущего года
  
  if (registrationDate < currentSeptember) {
    // Пользователь из прошлого учебного года
    return getAcademicYear(new Date(new Date().getFullYear() - 1, 8, 1));
  } else {
    // Пользователь текущего учебного года
    return getAcademicYear();
  }
}

async function calculateUserStats(userId) {
  // Здесь подсчитываем статистику пользователя
  // Это нужно адаптировать под вашу структуру БД
  
  try {
    // Попытка подсчитать участие в мероприятиях
    // Адаптируйте под вашу структуру БД
    const eventsCount = 0; // TODO: Реализовать подсчет мероприятий
    const achievements = []; // TODO: Получить достижения пользователя
    
    return {
      eventsCount,
      achievements
    };
  } catch (error) {
    console.warn(`Не удалось подсчитать статистику для пользователя ${userId}:`, error);
    return {
      eventsCount: 0,
      achievements: []
    };
  }
}

async function validateMigration() {
  const originalSum = await User.sum('points') || 0;
  const migratedSum = await AcademicYear.sum('totalPoints') || 0;
  
  if (Math.abs(originalSum - migratedSum) > 0.01) {
    throw new Error(`Validation failed! Original: ${originalSum}, Migrated: ${migratedSum}`);
  }
  
  console.log('✅ Валидация прошла успешно');
}

module.exports = { migrateToAcademicYears };
```

### 3.2 Тестовый скрипт для проверки
Создать файл: `scripts/testMigration.js`
```javascript
const path = require('path');

async function testMigration() {
  console.log('🧪 Тестирование миграции на копии БД...');
  
  // Временно переключаемся на тестовую БД
  const originalStorage = process.env.DB_STORAGE;
  process.env.DB_STORAGE = './test_database.sqlite';
  
  try {
    // Очищаем require cache для моделей
    delete require.cache[require.resolve('../models')];
    delete require.cache[require.resolve('../models/index.js')];
    
    const { migrateToAcademicYears } = require('./migrateToAcademicYears');
    await migrateToAcademicYears();
    
    console.log('✅ Тест миграции прошел успешно!');
    return true;
  } catch (error) {
    console.error('❌ Тест миграции провалился:', error);
    return false;
  } finally {
    // Восстанавливаем оригинальные настройки
    if (originalStorage) {
      process.env.DB_STORAGE = originalStorage;
    } else {
      delete process.env.DB_STORAGE;
    }
  }
}

if (require.main === module) {
  testMigration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testMigration };
```

---

## ЭТАП 4: ОБНОВЛЕНИЕ API (11-15 августа)

### 4.1 Создание сервиса для работы с учебными годами
Создать файл: `services/academicYearService.js`
```javascript
const { AcademicYear, User } = require('../models');
const { getAcademicYear, getAcademicYearDates } = require('../utils/academicYearUtils');

class AcademicYearService {
  /**
   * Обеспечивает существование записи для текущего учебного года пользователя
   */
  async ensureCurrentAcademicYear(userId) {
    const currentYear = getAcademicYear();
    
    let academicYearRecord = await AcademicYear.findOne({
      where: { userId, academicYear: currentYear }
    });
    
    if (!academicYearRecord) {
      // Деактивируем предыдущие годы
      await AcademicYear.update(
        { isActive: false },
        { where: { userId, isActive: true } }
      );
      
      // Создаем новый учебный год
      const { startDate, endDate } = getAcademicYearDates(currentYear);
      academicYearRecord = await AcademicYear.create({
        userId,
        academicYear: currentYear,
        totalPoints: 0,
        eventsParticipated: 0,
        achievementsEarned: [],
        startDate,
        endDate,
        isActive: true
      });
    }
    
    return academicYearRecord;
  }
  
  /**
   * Добавляет баллы пользователю за текущий учебный год
   */
  async addPoints(userId, points, reason = '') {
    const academicYear = await this.ensureCurrentAcademicYear(userId);
    
    await academicYear.increment('totalPoints', { by: points });
    
    // Также обновляем старую систему для совместимости
    await User.increment('points', { by: points, where: { id: userId } });
    
    return academicYear.reload();
  }
  
  /**
   * Получает статистику пользователя по учебным годам
   */
  async getUserStatistics(userId) {
    const academicYears = await AcademicYear.findAll({
      where: { userId },
      order: [['academicYear', 'DESC']]
    });
    
    const currentYear = academicYears.find(year => year.isActive);
    const previousYears = academicYears.filter(year => !year.isActive);
    
    return {
      currentYear: currentYear || null,
      previousYears,
      totalYears: academicYears.length
    };
  }
  
  /**
   * Добавляет участие в мероприятии
   */
  async addEventParticipation(userId) {
    const academicYear = await this.ensureCurrentAcademicYear(userId);
    await academicYear.increment('eventsParticipated', { by: 1 });
    return academicYear.reload();
  }
  
  /**
   * Добавляет достижение пользователю
   */
  async addAchievement(userId, achievementId) {
    const academicYear = await this.ensureCurrentAcademicYear(userId);
    const achievements = academicYear.achievementsEarned;
    
    if (!achievements.includes(achievementId)) {
      achievements.push(achievementId);
      academicYear.achievementsEarned = achievements;
      await academicYear.save();
    }
    
    return academicYear;
  }
}

module.exports = new AcademicYearService();
```

### 4.2 Обновление существующих маршрутов
Создать файл: `middleware/academicYearMiddleware.js`
```javascript
const academicYearService = require('../services/academicYearService');

/**
 * Middleware для автоматического создания учебного года
 */
async function ensureAcademicYear(req, res, next) {
  if (req.user && req.user.id) {
    try {
      req.academicYear = await academicYearService.ensureCurrentAcademicYear(req.user.id);
    } catch (error) {
      console.error('Ошибка создания учебного года:', error);
      // Не блокируем запрос, просто логируем ошибку
    }
  }
  next();
}

module.exports = { ensureAcademicYear };
```

### 4.3 Новые API маршруты
Создать файл: `routes/academicYears.js`
```javascript
const express = require('express');
const router = express.Router();
const academicYearService = require('../services/academicYearService');
const { authenticate } = require('../middleware/auth');

// Получить статистику пользователя по учебным годам
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const statistics = await academicYearService.getUserStatistics(req.user.id);
    res.json(statistics);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Получить текущий учебный год пользователя
router.get('/current', authenticate, async (req, res) => {
  try {
    const currentYear = await academicYearService.ensureCurrentAcademicYear(req.user.id);
    res.json(currentYear);
  } catch (error) {
    console.error('Ошибка получения текущего учебного года:', error);
    res.status(500).json({ error: 'Ошибка получения текущего учебного года' });
  }
});

module.exports = router;
```

---

## ЭТАП 5: ОБНОВЛЕНИЕ FRONTEND (16-20 августа)

### 5.1 Создание компонента статистики
Создать файл: `frontend/src/components/AcademicYearStats.tsx`
```typescript
import React from 'react';

interface AcademicYearData {
  academicYear: string;
  totalPoints: number;
  eventsParticipated: number;
  achievementsEarned: string[];
  isActive: boolean;
}

interface Props {
  currentYear: AcademicYearData | null;
  previousYears: AcademicYearData[];
}

export const AcademicYearStats: React.FC<Props> = ({ currentYear, previousYears }) => {
  return (
    <div className="academic-year-stats">
      {/* Текущий учебный год */}
      {currentYear && (
        <div className="current-year bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            {currentYear.academicYear} учебный год (текущий)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentYear.totalPoints}
              </div>
              <div className="text-sm text-gray-600">баллов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentYear.eventsParticipated}
              </div>
              <div className="text-sm text-gray-600">мероприятий</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {currentYear.achievementsEarned.length}
              </div>
              <div className="text-sm text-gray-600">достижений</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Предыдущие учебные годы */}
      {previousYears.length > 0 && (
        <div className="previous-years">
          <h4 className="text-md font-semibold mb-3 text-gray-700">
            Предыдущие учебные годы
          </h4>
          <div className="space-y-2">
            {previousYears.map((year) => (
              <div key={year.academicYear} className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">
                    {year.academicYear}
                  </span>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {year.totalPoints} баллов
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {year.eventsParticipated} мероприятий
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      {year.achievementsEarned.length} достижений
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!currentYear && previousYears.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Данных по учебным годам пока нет</p>
        </div>
      )}
    </div>
  );
};
```

### 5.2 Создание хука для работы с академическими годами
Создать файл: `frontend/src/hooks/useAcademicYears.ts`
```typescript
import { useState, useEffect } from 'react';

interface AcademicYearData {
  academicYear: string;
  totalPoints: number;
  eventsParticipated: number;
  achievementsEarned: string[];
  isActive: boolean;
}

interface AcademicYearStatistics {
  currentYear: AcademicYearData | null;
  previousYears: AcademicYearData[];
  totalYears: number;
}

export function useAcademicYears() {
  const [statistics, setStatistics] = useState<AcademicYearStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/academic-years/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
        setError(null);
      } else {
        setError('Ошибка загрузки статистики');
      }
    } catch (err) {
      setError('Ошибка сети');
      console.error('Ошибка получения статистики:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
}
```

### 5.3 Обновление страницы профиля
Обновить файл: `frontend/src/pages/Profile.tsx` (добавить в существующий компонент)
```typescript
// Добавить импорты
import { AcademicYearStats } from '../components/AcademicYearStats';
import { useAcademicYears } from '../hooks/useAcademicYears';

// Добавить в компонент Profile
export function Profile() {
  const { statistics, loading: academicLoading, error: academicError } = useAcademicYears();
  
  // ... остальной код компонента ...
  
  return (
    <div className="profile-page">
      {/* ... существующий код ... */}
      
      {/* Добавить секцию статистики по учебным годам */}
      <div className="academic-years-section mt-8">
        <h2 className="text-xl font-bold mb-4">Статистика по учебным годам</h2>
        
        {academicLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка статистики...</p>
          </div>
        )}
        
        {academicError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {academicError}
          </div>
        )}
        
        {statistics && !academicLoading && (
          <AcademicYearStats 
            currentYear={statistics.currentYear}
            previousYears={statistics.previousYears}
          />
        )}
      </div>
    </div>
  );
}
```

---

## ЭТАП 6: ТЕСТИРОВАНИЕ И ВАЛИДАЦИЯ (21-25 августа)

### 6.1 Скрипт полного тестирования
Создать файл: `scripts/fullSystemTest.js`
```javascript
const { testMigration } = require('./testMigration');
const { getAcademicYear } = require('../utils/academicYearUtils');

async function runFullTest() {
  console.log('🧪 ПОЛНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ УЧЕБНЫХ ГОДОВ');
  console.log('='.repeat(50));
  
  let allTestsPassed = true;
  
  try {
    // 1. Тестируем миграцию
    console.log('1. Тестирование миграции...');
    const migrationSuccess = await testMigration();
    if (!migrationSuccess) {
      allTestsPassed = false;
      console.log('❌ Миграция провалилась');
    } else {
      console.log('✅ Миграция прошла успешно');
    }
    
    // 2. Тестируем утилиты
    console.log('\n2. Тестирование утилит...');
    const currentAcademicYear = getAcademicYear();
    console.log(`   Текущий учебный год: ${currentAcademicYear}`);
    
    // Тестируем разные даты
    const testDates = [
      new Date(2025, 0, 15), // 15 января 2025
      new Date(2025, 8, 1),  // 1 сентября 2025
      new Date(2025, 11, 25) // 25 декабря 2025
    ];
    
    for (const date of testDates) {
      const academicYear = getAcademicYear(date);
      console.log(`   ${date.toLocaleDateString('ru-RU')} -> ${academicYear}`);
    }
    
    // 3. Проверяем наличие всех файлов
    console.log('\n3. Проверка наличия файлов...');
    const fs = require('fs');
    const requiredFiles = [
      'models/AcademicYear.js',
      'utils/academicYearUtils.js',
      'services/academicYearService.js',
      'middleware/academicYearMiddleware.js',
      'routes/academicYears.js',
      'scripts/migrateToAcademicYears.js'
    ];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ❌ ${file} - отсутствует`);
        allTestsPassed = false;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
      console.log('✅ Система готова к внедрению');
    } else {
      console.log('❌ НЕКОТОРЫЕ ТЕСТЫ ПРОВАЛИЛИСЬ');
      console.log('⚠️  Исправьте ошибки перед внедрением');
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Критическая ошибка во время тестирования:', error);
    return false;
  }
}

if (require.main === module) {
  runFullTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runFullTest };
```

### 6.2 Создание чек-листа
Создать файл: `ACADEMIC_YEAR_CHECKLIST.md`
```markdown
# ЧЕК-ЛИСТ ВНЕДРЕНИЯ СИСТЕМЫ УЧЕБНЫХ ГОДОВ

## Подготовка
- [ ] Создана резервная копия БД
- [ ] Создана тестовая копия БД
- [ ] Проведен анализ текущих данных

## Backend файлы
- [ ] `models/AcademicYear.js` создан
- [ ] `models/index.js` обновлен
- [ ] `utils/academicYearUtils.js` создан
- [ ] `services/academicYearService.js` создан
- [ ] `middleware/academicYearMiddleware.js` создан
- [ ] `routes/academicYears.js` создан
- [ ] `scripts/migrateToAcademicYears.js` создан
- [ ] `scripts/testMigration.js` создан
- [ ] `scripts/fullSystemTest.js` создан

## Frontend файлы
- [ ] `components/AcademicYearStats.tsx` создан
- [ ] `hooks/useAcademicYears.ts` создан
- [ ] `pages/Profile.tsx` обновлен

## Тестирование
- [ ] Тест миграции на копии БД прошел
- [ ] Полное системное тестирование прошло
- [ ] API маршруты протестированы
- [ ] Frontend компоненты работают

## Финальные проверки
- [ ] Все файлы на месте
- [ ] Нет синтаксических ошибок
- [ ] База данных готова к миграции
- [ ] Команда уведомлена о предстоящем обновлении

## Внедрение
- [ ] Создана финальная резервная копия
- [ ] Миграция выполнена
- [ ] Валидация прошла успешно
- [ ] Система работает корректно

## План отката (на случай проблем)
- [ ] Путь к резервной копии: `database_backup_academic_years_YYYYMMDD_HHMMSS.sqlite`
- [ ] Команда отката: `cp database_backup_academic_years_*.sqlite database.sqlite`
- [ ] Перезапуск сервера после отката
```

---

## ЭТАП 7: ФИНАЛЬНОЕ ВНЕДРЕНИЕ (26-31 августа)

### 7.1 Скрипт внедрения
Создать файл: `scripts/deployAcademicYears.js`
```javascript
const readline = require('readline');
const fs = require('fs');

async function deployAcademicYears() {
  console.log('🚀 ВНЕДРЕНИЕ СИСТЕМЫ УЧЕБНЫХ ГОДОВ');
  console.log('⚠️  КРИТИЧЕСКИ ВАЖНО: Убедитесь, что создана резервная копия!');
  console.log('');
  
  // Проверяем наличие резервной копии
  const backupFiles = fs.readdirSync('.').filter(file => 
    file.startsWith('database_backup_academic_years_') && file.endsWith('.sqlite')
  );
  
  if (backupFiles.length === 0) {
    console.log('❌ ВНИМАНИЕ: Не найдена резервная копия БД!');
    console.log('   Создайте резервную копию командой:');
    console.log('   cp database.sqlite database_backup_academic_years_$(date +%Y%m%d_%H%M%S).sqlite');
    console.log('');
    return;
  }
  
  console.log(`✅ Найдена резервная копия: ${backupFiles[backupFiles.length - 1]}`);
  console.log('');
  
  // Подтверждение от пользователя
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('Вы подтверждаете внедрение системы учебных годов? (yes/no): ', resolve);
  });
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Внедрение отменено пользователем');
    rl.close();
    return;
  }
  
  try {
    console.log('');
    console.log('🔄 Начинаем внедрение...');
    
    // Выполняем миграцию на продакшене
    const { migrateToAcademicYears } = require('./migrateToAcademicYears');
    await migrateToAcademicYears();
    
    console.log('');
    console.log('🎉 ВНЕДРЕНИЕ ЗАВЕРШЕНО УСПЕШНО!');
    console.log('📅 Система учебных годов активна');
    console.log('✅ Пользователи теперь могут видеть статистику по учебным годам');
    console.log('');
    console.log('📋 Следующие шаги:');
    console.log('   1. Перезапустите сервер: npm restart');
    console.log('   2. Пересоберите frontend: npm run build');
    console.log('   3. Проверьте работу системы в браузере');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА ВНЕДРЕНИЯ:', error);
    console.error('');
    console.error('🔄 ПЛАН ВОССТАНОВЛЕНИЯ:');
    console.error('   1. Остановите сервер');
    console.error(`   2. Восстановите БД: cp ${backupFiles[backupFiles.length - 1]} database.sqlite`);
    console.error('   3. Перезапустите сервер');
    console.error('   4. Проанализируйте ошибку перед повторной попыткой');
    console.error('');
  }
  
  rl.close();
}

if (require.main === module) {
  deployAcademicYears();
}

module.exports = { deployAcademicYears };
```

### 7.2 Скрипт отката
Создать файл: `scripts/rollbackAcademicYears.js`
```javascript
const fs = require('fs');
const readline = require('readline');

async function rollbackAcademicYears() {
  console.log('🔄 ОТКАТ СИСТЕМЫ УЧЕБНЫХ ГОДОВ');
  console.log('⚠️  Это действие восстановит предыдущую версию БД');
  console.log('');
  
  // Ищем резервные копии
  const backupFiles = fs.readdirSync('.').filter(file => 
    file.startsWith('database_backup_academic_years_') && file.endsWith('.sqlite')
  );
  
  if (backupFiles.length === 0) {
    console.log('❌ Резервные копии не найдены!');
    console.log('   Откат невозможен.');
    return;
  }
  
  // Сортируем по дате (самая новая первая)
  backupFiles.sort().reverse();
  
  console.log('📋 Доступные резервные копии:');
  backupFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  console.log('');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const backupChoice = await new Promise(resolve => {
    rl.question(`Выберите резервную копию (1-${backupFiles.length}) или 0 для отмены: `, resolve);
  });
  
  const choiceIndex = parseInt(backupChoice) - 1;
  
  if (choiceIndex < 0 || choiceIndex >= backupFiles.length) {
    console.log('❌ Откат отменен');
    rl.close();
    return;
  }
  
  const selectedBackup = backupFiles[choiceIndex];
  
  const confirmation = await new Promise(resolve => {
    rl.question(`Восстановить БД из ${selectedBackup}? (yes/no): `, resolve);
  });
  
  if (confirmation.toLowerCase() !== 'yes') {
    console.log('❌ Откат отменен');
    rl.close();
    return;
  }
  
  try {
    // Создаем копию текущей БД на случай
    const currentBackup = `database_rollback_backup_${Date.now()}.sqlite`;
    fs.copyFileSync('database.sqlite', currentBackup);
    console.log(`✅ Создана копия текущей БД: ${currentBackup}`);
    
    // Восстанавливаем из резервной копии
    fs.copyFileSync(selectedBackup, 'database.sqlite');
    
    console.log('');
    console.log('🎉 ОТКАТ ВЫПОЛНЕН УСПЕШНО!');
    console.log(`✅ БД восстановлена из ${selectedBackup}`);
    console.log('');
    console.log('📋 Следующие шаги:');
    console.log('   1. Перезапустите сервер');
    console.log('   2. Проверьте работу системы');
    console.log('   3. Проанализируйте причину отката');
    console.log('');
    
  } catch (error) {
    console.error('❌ Ошибка отката:', error);
  }
  
  rl.close();
}

if (require.main === module) {
  rollbackAcademicYears();
}

module.exports = { rollbackAcademicYears };
```

---

## ИНСТРУКЦИЯ ПО ЗАПУСКУ ДЛЯ АГЕНТА

### Команды для последовательного выполнения:

```bash
# ЭТАП 1: Подготовка (1-2 августа)
cd "/home/el/Рабочий стол/ProjectX/backend"
cp database.sqlite database_backup_academic_years_$(date +%Y%m%d_%H%M%S).sqlite
cp database.sqlite test_database.sqlite
node scripts/analyzeCurrentData.js

# ЭТАП 3: Тестирование миграции (6-10 августа)
node scripts/testMigration.js

# ЭТАП 6: Полное тестирование (21-25 августа)
node scripts/fullSystemTest.js

# ЭТАП 7: Финальное внедрение (26-31 августа) - ОСТОРОЖНО!
node scripts/deployAcademicYears.js

# В случае проблем - откат
node scripts/rollbackAcademicYears.js
```

### Критически важные моменты:

1. **НЕ ВЫПОЛНЯТЬ ДО АВГУСТА 2026!** - Сейчас сентябрь 2025, учебный год только начался
2. **ОБЯЗАТЕЛЬНО создавать резервную копию** перед любыми действиями
3. **Тестировать ВСЁ на копии БД** перед применением к продакшену
4. **Выполнять этапы последовательно** - не пропускать тестирование
5. **Иметь план отката** на случай проблем

### Ожидаемый результат:

После успешного внедрения пользователи смогут:
- Видеть статистику по текущему учебному году
- Просматривать историю прошлых лет
- Автоматически начинать новый год с нулевыми баллами каждое 1 сентября
- Сохранять достижения и прогресс за каждый учебный год

### Безопасность:

Система спроектирована так, чтобы:
- Не потерять существующие данные
- Работать параллельно со старой системой
- Позволить откат в любой момент
- Сохранить совместимость с существующим кодом

---

**🎯 ЦЕЛЬ**: Создать мотивирующую систему отслеживания прогресса учеников по учебным годам без потери существующих данных.

**⚠️ ВАЖНО**: Эта инструкция должна выполняться только в августе 2026 года, когда закончится текущий учебный год!
