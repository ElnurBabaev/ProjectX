const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { adminAuth } = require('../middleware/auth');
const AchievementChecker = require('../utils/achievementChecker');
const { recalculateUserPoints } = require('../utils/pointsCalculator');
const Notification = require('../models/Notification');
const xlsx = require('xlsx');

const router = express.Router();

// === СТАТИСТИКА И АНАЛИТИКА ===

// Получение общей статистики
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    const stats = {};

    // Статистика пользователей
    const usersResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
      FROM users
    `);
    stats.users = usersResult.rows[0];

    // Статистика событий
    const eventsResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) as upcoming,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM events
    `);
    stats.events = eventsResult.rows[0];

    // Статистика товаров
    const productsResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
      FROM products
    `);
    stats.products = productsResult.rows[0];

    // Статистика достижений
    const achievementsResult = await db.query(`
      SELECT 
        COUNT(*) as total_achievements,
        (SELECT COUNT(*) FROM user_achievements) as awarded_achievements
      FROM achievements
    `);
    stats.achievements = achievementsResult.rows[0];

    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===

// Получение всех пользователей
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = `SELECT 
      id, 
      login, 
      first_name, 
      last_name, 
      class_grade, 
      class_letter, 
      role, 
      total_earned_points as personalPoints,
      points, 
      admin_points,
      created_at 
    FROM users`;
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    if (search) {
      query += (params.length > 0 ? ' AND' : ' WHERE');
      query += ' (login LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание нового пользователя
router.post('/users', [
  adminAuth,
  body('login').isLength({ min: 3, max: 50 }).withMessage('Логин должен быть от 3 до 50 символов'),
  body('password').isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
  body('first_name').notEmpty().withMessage('Имя обязательно'),
  body('last_name').notEmpty().withMessage('Фамилия обязательна'),
  body('role').optional().isIn(['student', 'admin']).withMessage('Неверная роль')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { login, password, first_name, last_name, class_grade, class_letter, role } = req.body;

    // Проверяем уникальность
    const existingResult = await db.query(
      'SELECT id FROM users WHERE login = ?',
      [login]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(`
      INSERT INTO users (login, password, first_name, last_name, class_grade, class_letter, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [login, hashedPassword, first_name, last_name, class_grade || null, class_letter || null, role || 'student']);

    res.status(201).json({
      message: 'Пользователь успешно создан',
      user: {
        id: result.insertId,
        login,
        first_name,
        last_name,
        class_grade: class_grade || null,
        class_letter: class_letter || null,
        role: role || 'student'
      }
    });
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение мероприятий пользователя
router.get('/users/:userId/events', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Проверяем существование пользователя
    const userResult = await db.query('SELECT id, first_name, last_name FROM users WHERE id = ?', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Получаем мероприятия пользователя
    const eventsResult = await db.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.start_date,
        e.end_date,
        e.location,
        e.points,
        er.status,
        er.registered_at
      FROM events e
      JOIN event_registrations er ON e.id = er.event_id
      WHERE er.user_id = ?
      ORDER BY e.start_date DESC
    `, [userId]);

    res.json({
      user: userResult.rows[0],
      events: eventsResult.rows
    });
  } catch (error) {
    console.error('Ошибка получения мероприятий пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление пользователя
router.put('/users/:id', [
  adminAuth,
  body('login').optional().isLength({ min: 3, max: 50 }),
  body('first_name').optional().notEmpty(),
  body('last_name').optional().notEmpty(),
  body('role').optional().isIn(['student', 'admin']),
  body('admin_points').optional().isInt({ min: 0 }).withMessage('Баллы администратора должны быть неотрицательным числом'),
  body('total_points').optional().isInt({ min: 0 }).withMessage('Общие баллы должны быть неотрицательным числом (устаревшее поле)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.id;
    const { login, first_name, last_name, class_grade, class_letter, role, admin_points, total_points } = req.body;

    // Совместимость: если передано total_points вместо admin_points
    const pointsToSet = admin_points !== undefined ? admin_points : total_points;

    // Проверяем существование пользователя
    const userResult = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем уникальность при обновлении
    if (login) {
      const existingResult = await db.query(
        'SELECT id FROM users WHERE login = ? AND id != ?',
        [login, userId]
      );
      
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
      }
    }

    const updates = [];
    const params = [];

    if (login) {
      updates.push('login = ?');
      params.push(login);
    }
    if (first_name) {
      updates.push('first_name = ?');
      params.push(first_name);
    }
    if (last_name) {
      updates.push('last_name = ?');
      params.push(last_name);
    }
    if (class_grade !== undefined) {
      updates.push('class_grade = ?');
      params.push(class_grade);
    }
    if (class_letter !== undefined) {
      updates.push('class_letter = ?');
      params.push(class_letter);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (pointsToSet !== undefined) {
      updates.push('admin_points = ?');
      params.push(pointsToSet);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    if (updates.length > 1) { // Больше 1, потому что updated_at всегда добавляется
      await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Если изменились баллы администратора, пересчитываем общие баллы
    if (pointsToSet !== undefined) {
      await recalculateUserPoints(userId);
      console.log(`Администратор изменил admin_points для пользователя ${userId} на ${pointsToSet}`);
    }

    res.json({ message: 'Данные пользователя обновлены' });
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление пользователя
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId == req.user.id) {
      return res.status(400).json({ message: 'Нельзя удалить собственную учетную запись' });
    }

    const result = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Сброс пароля пользователя
router.post('/users/:id/reset-password', [
  adminAuth,
  body('newPassword').isLength({ min: 6 }).withMessage('Новый пароль должен быть не менее 6 символов')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;
    const userId = req.params.id;

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const result = await db.query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({ message: 'Пароль пользователя успешно сброшен' });
  } catch (error) {
    console.error('Ошибка сброса пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// === УПРАВЛЕНИЕ СОБЫТИЯМИ (Admin) ===

// Получение всех событий для админа
router.get('/events', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, 
             u.username as created_by_username,
             (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as participants_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.start_date DESC
    `);
    res.json({ events: result.rows });
  } catch (error) {
    console.error('Ошибка получения событий:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение участников события для админа
router.get('/events/:eventId/participants', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const result = await db.query(`
      SELECT u.id, u.first_name as firstName, u.last_name as lastName, 
             u.class_grade as classGrade, u.class_letter as classLetter,
             er.status, er.registered_at
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = ?
      ORDER BY er.registered_at DESC
    `, [eventId]);
    
    res.json({ participants: result.rows });
  } catch (error) {
    console.error('Ошибка получения участников события:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Экспорт участников события в Excel
router.get('/events/:eventId/export-participants', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Получаем информацию о событии
    const eventResult = await db.query('SELECT title FROM events WHERE id = ?', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }
    
    const eventTitle = eventResult.rows[0].title;
    
    // Получаем участников
    const participantsResult = await db.query(`
      SELECT u.first_name as firstName, 
             u.last_name as lastName,
             u.class_grade as classGrade,
             u.class_letter as classLetter,
             er.status,
             er.registered_at
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = ?
      ORDER BY er.registered_at DESC
    `, [eventId]);
    
    if (participantsResult.rows.length === 0) {
      return res.status(404).json({ message: 'На это событие никто не зарегистрирован' });
    }
    
    // Преобразуем данные для Excel
    const excelData = participantsResult.rows.map(participant => ({
      'Имя': participant.firstName,
      'Фамилия': participant.lastName,
      'Класс': (participant.classGrade && participant.classLetter) 
        ? `${participant.classGrade}${participant.classLetter}` 
        : '',
      'Статус участия': participant.status === 'registered' ? 'Зарегистрирован' : 
                       participant.status === 'attended' ? 'Присутствовал' : 
                       participant.status,
      'Дата регистрации': new Date(participant.registered_at).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
    
    // Создаем Excel файл
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Участники');
    
    // Устанавливаем ширину колонок
    const maxWidth = 20;
    worksheet['!cols'] = [
      { width: 15 }, // Имя
      { width: 15 }, // Фамилия
      { width: 8 },  // Класс
      { width: 18 }, // Статус
      { width: 20 }  // Дата регистрации
    ];
    
    // Генерируем Excel файл в буфер
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Устанавливаем заголовки для скачивания файла
    const fileName = `Участники_${eventTitle.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    
  } catch (error) {
    console.error('Ошибка экспорта участников события:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Подтверждение участия в событии
router.post('/events/:eventId/confirm-attendance', [
  adminAuth,
  body('userId').isInt().withMessage('ID пользователя должен быть числом')
], async (req, res) => {
  try {
    console.log('POST /admin/events/:eventId/confirm-attendance called with eventId:', req.params.eventId, 'userId:', req.body.userId);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId } = req.params;
    const { userId } = req.body;

    // Проверяем существование события
    const eventCheck = await db.query('SELECT id, title, points FROM events WHERE id = ?', [eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }
    const event = eventCheck.rows[0];

    // Проверяем существование регистрации
    const registrationCheck = await db.query(
      'SELECT id, status FROM event_registrations WHERE event_id = ? AND user_id = ?', 
      [eventId, userId]
    );
    if (registrationCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Регистрация на событие не найдена' });
    }

    const registration = registrationCheck.rows[0];
    if (registration.status === 'attended') {
      return res.status(400).json({ message: 'Участие уже подтверждено' });
    }

    // Обновляем статус регистрации на "присутствовал" и фиксируем начисленные баллы за событие
    await db.query(
      'UPDATE event_registrations SET status = ?, points_awarded = ? WHERE event_id = ? AND user_id = ?',
      ['attended', event.points || 0, eventId, userId]
    );

    console.log('Updated registration status to attended');

    // Пересчитываем общие баллы пользователя
    await recalculateUserPoints(userId);
    
    // Проверяем, не получил ли пользователь новые достижения
    try {
      await AchievementChecker.checkAfterEventParticipation(userId);
    } catch (achievementError) {
      console.error(`Ошибка при проверке достижений для пользователя ${userId} после события ${eventId}:`, achievementError);
      // Не прерываем основной процесс, просто логируем ошибку
    }

    // Создаем уведомление
    await Notification.create(
      userId,
      'event_confirmed',
      `Ваше участие в мероприятии "${event.title}" подтверждено!`,
      `Вы были отмечены как присутствующий на мероприятии "${event.title}". Вам начислено ${event.points} баллов.`,
      eventId
    );

    res.json({ message: 'Участие подтверждено, баллы начислены' });
  } catch (error) {
    console.error('Ошибка подтверждения участия:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отмена подтверждения участия
router.post('/events/:eventId/cancel-attendance', [
  adminAuth,
  body('userId').isInt().withMessage('ID пользователя должен быть числом')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId } = req.params;
    const { userId } = req.body;

    // Проверяем существование события
    const eventCheck = await db.query('SELECT id, points FROM events WHERE id = ?', [eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }

    // Проверяем существование регистрации
    const registrationCheck = await db.query(
      'SELECT id, status FROM event_registrations WHERE event_id = ? AND user_id = ?', 
      [eventId, userId]
    );
    if (registrationCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Регистрация на событие не найдена' });
    }

    const registration = registrationCheck.rows[0];
    if (registration.status !== 'attended') {
      return res.status(400).json({ message: 'Участие не было подтверждено' });
    }

    const event = eventCheck.rows[0];

    // Возвращаем статус на "зарегистрирован" и обнуляем начисление за событие
    await db.query(
      'UPDATE event_registrations SET status = ?, points_awarded = 0 WHERE event_id = ? AND user_id = ?',
      ['registered', eventId, userId]
    );

    // Пересчитываем баланс
    await recalculateUserPoints(userId);

    res.json({ 
      message: 'Подтверждение участия отменено',
  pointsDeducted: Math.floor(event.points || 0)
    });
  } catch (error) {
    console.error('Ошибка отмены подтверждения участия:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// === УПРАВЛЕНИЕ ТОВАРАМИ (Admin) ===

// Получение всех товаров для админа
router.get('/products', adminAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ products: result.rows });
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание товара (Admin)
router.post('/products', [
  adminAuth,
  body('name').notEmpty().withMessage('Название товара обязательно'),
  body('description').notEmpty().withMessage('Описание товара обязательно'),
  body('price').isNumeric().withMessage('Цена должна быть числом'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Количество на складе должно быть неотрицательным числом'),
  body('category').notEmpty().withMessage('Категория обязательна')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock_quantity, category, imageUrl, active } = req.body;

    const result = await db.query(`
      INSERT INTO products (name, description, price, stock_quantity, category, image_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description, parseFloat(price), stock_quantity, category, imageUrl || null, active !== undefined ? active : 1]);

    res.status(201).json({
      message: 'Товар создан',
      product: {
        id: result.insertId,
        name,
        description,
        price: parseFloat(price),
        stock_quantity,
        category,
        image_url: imageUrl,
        is_active: active !== undefined ? active : 1
      }
    });
  } catch (error) {
    console.error('Ошибка создания товара:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление товара (Admin)
router.put('/products/:id', [
  adminAuth,
  body('name').notEmpty().withMessage('Название товара обязательно'),
  body('description').notEmpty().withMessage('Описание товара обязательно'),
  body('price').isNumeric().withMessage('Цена должна быть числом'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Количество на складе должно быть неотрицательным числом'),
  body('category').notEmpty().withMessage('Категория обязательна')
], async (req, res) => {
  try {
    console.log(`🔄 Обновление товара ${req.params.id}:`, req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Ошибки валидации:', errors.array());
      return res.status(400).json({ 
        message: 'Ошибка валидации данных',
        errors: errors.array() 
      });
    }

    const { name, description, price, stock_quantity, category, imageUrl, active } = req.body;

    const result = await db.query(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, stock_quantity = ?, category = ?, image_url = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, parseFloat(price), stock_quantity, category, imageUrl || null, active !== undefined ? active : 1, req.params.id]);

    if (result.affectedRows === 0) {
      console.error('❌ Товар не найден:', req.params.id);
      return res.status(404).json({ message: 'Товар не найден' });
    }

    console.log('✅ Товар успешно обновлен:', req.params.id);
    res.json({ message: 'Товар обновлен' });
  } catch (error) {
    console.error('❌ Ошибка обновления товара:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление товара (Admin - мягкое удаление)
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE products SET is_active = 0 WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    res.json({ message: 'Товар удален' });
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение покупок товара (Admin)
router.get('/products/:id/purchases', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.first_name as firstName, u.last_name as lastName, 
             u.class_grade as classGrade, u.class_letter as classLetter,
             oi.quantity, oi.price, o.created_at as purchaseDate
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE oi.product_id = ?
      ORDER BY o.created_at DESC
    `, [req.params.id]);

    res.json({ purchases: result.rows });
  } catch (error) {
    console.error('Ошибка получения покупок товара:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Экспорт покупок товара в Excel (Admin)
router.get('/products/:id/export-purchases', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Информация о товаре
    const productResult = await db.query('SELECT name FROM products WHERE id = ?', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    const productName = productResult.rows[0].name;

    // Покупки по товару
    const purchasesResult = await db.query(`
      SELECT u.first_name as firstName, 
             u.last_name as lastName,
             u.class_grade as classGrade,
             u.class_letter as classLetter,
             oi.quantity,
             oi.price,
             (oi.quantity * oi.price) as total,
             o.created_at as purchaseDate
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE oi.product_id = ?
      ORDER BY o.created_at DESC
    `, [id]);

    if (purchasesResult.rows.length === 0) {
      return res.status(404).json({ message: 'Покупок по этому товару нет' });
    }

    // Подготовка данных для Excel
    const excelData = purchasesResult.rows.map(p => ({
      'Имя': p.firstName,
      'Фамилия': p.lastName,
      'Класс': (p.classGrade && p.classLetter) ? `${p.classGrade}${p.classLetter}` : '',
      'Количество': p.quantity,
      'Цена (баллы)': p.price,
      'Сумма (баллы)': p.total,
      'Дата покупки': new Date(p.purchaseDate).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Покупки');

    worksheet['!cols'] = [
      { width: 15 }, // Имя
      { width: 15 }, // Фамилия
      { width: 8 },  // Класс
      { width: 10 }, // Количество
      { width: 14 }, // Цена
      { width: 14 }, // Сумма
      { width: 20 }  // Дата
    ];

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const fileName = `Покупки_${productName.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Ошибка экспорта покупок товара:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// === УПРАВЛЕНИЕ ДОСТИЖЕНИЯМИ (Admin) ===

// Получение всех достижений для админа
router.get('/achievements', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*,
             (SELECT COUNT(*) FROM user_achievements ua WHERE ua.achievement_id = a.id) as awarded_count
      FROM achievements a
      ORDER BY a.created_at DESC
    `);
    res.json({ achievements: result.rows });
  } catch (error) {
    console.error('Ошибка получения достижений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение пользователей с достижением
router.get('/achievements/:achievementId/users', adminAuth, async (req, res) => {
  try {
    const { achievementId } = req.params;
    
    const result = await db.query(`
      SELECT u.id, u.first_name as firstName, u.last_name as lastName, 
             u.class_grade as classGrade, u.class_letter as classLetter,
             ua.awarded_at
      FROM user_achievements ua
      JOIN users u ON ua.user_id = u.id
      WHERE ua.achievement_id = ?
      ORDER BY ua.awarded_at DESC
    `, [achievementId]);
    
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Ошибка получения пользователей достижения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Назначение достижения пользователю
router.post('/achievements/:achievementId/assign', [
  adminAuth,
  body('userId').isInt().withMessage('ID пользователя должен быть числом')
], async (req, res) => {
  try {
    console.log('🔍 Роут назначения достижения вызван:', req.params, req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { achievementId } = req.params;
    const { userId } = req.body;

    console.log('🔍 Назначаем достижение:', achievementId, 'пользователю:', userId);

    // Проверяем существование достижения
    const achievementCheck = await db.query('SELECT id, points FROM achievements WHERE id = ?', [achievementId]);
    if (achievementCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }

    // Проверяем существование пользователя
    const userCheck = await db.query('SELECT id, points FROM users WHERE id = ?', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем, нет ли уже такого достижения у пользователя
    const existingCheck = await db.query(
      'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?', 
      [userId, achievementId]
    );
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ message: 'У пользователя уже есть это достижение' });
    }

    const achievement = achievementCheck.rows[0];
    const user = userCheck.rows[0];

    // Добавляем достижение пользователю
    await db.query(
      'INSERT INTO user_achievements (user_id, achievement_id, awarded_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [userId, achievementId]
    );
    console.log('✅ Достижение добавлено в user_achievements');

    // Получаем данные о достижении для уведомления
    const achievementResult = await db.query('SELECT title FROM achievements WHERE id = ?', [achievementId]);
    const achievementTitle = achievementResult.rows[0]?.title;
    console.log('🔍 Название достижения для уведомления:', achievementTitle);

    // Создаем уведомление о получении достижения
    try {
      console.log('🔍 Создаем уведомление для пользователя:', userId);
      await Notification.create(
        userId,
        'achievement_earned',
        'Новое достижение!',
        `Вы получили достижение "${achievementTitle}"`,
        achievementId
      );
      console.log(`✅ Уведомление о достижении создано для пользователя ${userId}`);
    } catch (notificationError) {
      console.error('❌ Ошибка создания уведомления о достижении:', notificationError);
    }

    // Пересчитываем баланс по новой модели
    await recalculateUserPoints(userId);

    res.json({ 
  message: 'Достижение успешно назначено пользователю',
  pointsAwarded: achievement.points
    });
  } catch (error) {
    console.error('Ошибка назначения достижения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отзыв достижения у пользователя
router.post('/achievements/:achievementId/revoke', [
  adminAuth,
  body('userId').isInt().withMessage('ID пользователя должен быть числом')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { achievementId } = req.params;
    const { userId } = req.body;

    // Проверяем существование достижения
    const achievementCheck = await db.query('SELECT id, points FROM achievements WHERE id = ?', [achievementId]);
    if (achievementCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }

    // Проверяем существование пользователя
    const userCheck = await db.query('SELECT id, points FROM users WHERE id = ?', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем, есть ли такое достижение у пользователя
    const existingCheck = await db.query(
      'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?', 
      [userId, achievementId]
    );
    if (existingCheck.rows.length === 0) {
      return res.status(400).json({ message: 'У пользователя нет этого достижения' });
    }

    const achievement = achievementCheck.rows[0];
    const user = userCheck.rows[0];

  // Удаляем достижение у пользователя
    await db.query(
      'DELETE FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );

  // Пересчитываем баланс по новой модели (total_earned уменьшится, points тоже пересчитаются)
  await recalculateUserPoints(userId);

    res.json({ 
  message: 'Достижение успешно отозвано у пользователя',
  pointsDeducted: achievement.points
    });
  } catch (error) {
    console.error('Ошибка отзыва достижения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение статистики по пользователям
router.get('/users-stats', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.login,
        u.first_name,
        u.last_name,
        u.class_grade,
        u.class_letter,
        u.role,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.user_id = u.id) as events_count,
        (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id) as achievements_count,
        u.created_at
      FROM users u
      ORDER BY u.created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Ошибка получения статистики пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Экспорт данных в CSV
router.get('/export/users', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.login,
        u.first_name,
        u.last_name,
        u.class_grade,
        u.class_letter,
        u.role,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.user_id = u.id) as events_count,
        (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id) as achievements_count,
        u.created_at
      FROM users u
      ORDER BY u.created_at DESC
    `);

    const csv = generateUsersCSV(result.rows);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send('\uFEFF' + csv); // BOM для корректной кодировки в Excel
  } catch (error) {
    console.error('Ошибка экспорта пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// === ОБНОВЛЕНИЕ БАЛЛОВ ПОЛЬЗОВАТЕЛЯ ===
// Проверить все достижения для пользователя
router.post('/users/:userId/check-achievements', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Проверяем существование пользователя
    const userCheck = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем все достижения
    const earnedAchievements = await AchievementChecker.checkAllAchievements(userId);

    res.json({
      message: `Проверка завершена. Получено достижений: ${earnedAchievements.length}`,
      achievementsEarned: earnedAchievements.length,
      newAchievements: earnedAchievements.map(a => ({
        id: a.id,
        title: a.title,
        points: a.points,
        requirements: a.requirements
      }))
    });
  } catch (error) {
    console.error('Ошибка проверки достижений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Проверить достижения для всех пользователей
router.post('/check-all-achievements', adminAuth, async (req, res) => {
  try {
    const usersResult = await db.query('SELECT id FROM users WHERE role = ?', ['student']);
    const users = usersResult.rows;
    
    let totalEarnedAchievements = 0;
    const results = [];

    for (const user of users) {
      const earnedAchievements = await AchievementChecker.checkAllAchievements(user.id);
      totalEarnedAchievements += earnedAchievements.length;
      
      if (earnedAchievements.length > 0) {
        results.push({
          userId: user.id,
          achievementsEarned: earnedAchievements.length,
          newAchievements: earnedAchievements.map(a => ({ id: a.id, title: a.title }))
        });
      }
    }

    res.json({
      message: `Проверка завершена для ${users.length} пользователей. Всего получено достижений: ${totalEarnedAchievements}`,
      totalUsers: users.length,
      totalAchievementsEarned: totalEarnedAchievements,
      results
    });
  } catch (error) {
    console.error('Ошибка глобальной проверки достижений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

function generateUsersCSV(users) {
    const header = 'ID,Логин,Имя,Фамилия,Класс,Роль,Участие в событиях,Достижения,Дата создания\n';
  const rows = users.map(user => 
    `${user.id},"${user.login}","${user.first_name}","${user.last_name}","${user.class_grade || ''}${user.class_letter || ''}","${user.role}",${user.events_count},${user.achievements_count},"${user.created_at}"`
  ).join('\n');
  return header + rows;
}

// === УПРАВЛЕНИЕ БАЛЛАМИ ===

// Добавление баллов пользователю
router.post('/users/:userId/points/add', [
  adminAuth,
  body('points').isInt({ min: 1 }).withMessage('Количество баллов должно быть положительным числом'),
  body('reason').optional().isString().withMessage('Причина должна быть строкой')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { points, reason } = req.body;

    // Проверяем, что пользователь существует
    const userResult = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Добавляем баллы к admin_points
    await db.query(`
      UPDATE users 
      SET admin_points = COALESCE(admin_points, 0) + ?
      WHERE id = ?
    `, [points, userId]);

    // Пересчитываем общие баллы
    await recalculateUserPoints(userId);

    // Проверяем достижения после изменения баллов
    const earnedAchievements = await AchievementChecker.checkAfterPointsEarned(userId);

    // Логируем действие (можно добавить таблицу логов позже)
    console.log(`Администратор добавил ${points} баллов пользователю ${userId}${reason ? ` (причина: ${reason})` : ''}`);
    if (earnedAchievements.length > 0) {
      console.log(`Пользователь ${userId} получил достижения:`, earnedAchievements.map(a => a.title));
    }

    res.json({ 
      message: `Успешно добавлено ${points} баллов пользователю`,
      user: userResult.rows[0].first_name + ' ' + userResult.rows[0].last_name,
      earnedAchievements: earnedAchievements
    });
  } catch (error) {
    console.error('Ошибка добавления баллов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Снятие баллов с пользователя
router.post('/users/:userId/points/subtract', [
  adminAuth,
  body('points').isInt({ min: 1 }).withMessage('Количество баллов должно быть положительным числом'),
  body('reason').optional().isString().withMessage('Причина должна быть строкой')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { points, reason } = req.body;

    // Проверяем, что пользователь существует
    const userResult = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Снимаем баллы с admin_points
    await db.query(`
      UPDATE users 
      SET admin_points = COALESCE(admin_points, 0) - ?
      WHERE id = ?
    `, [points, userId]);

    // Пересчитываем общие баллы
    await recalculateUserPoints(userId);

    // Проверяем достижения после изменения баллов
    const earnedAchievements = await AchievementChecker.checkAfterPointsEarned(userId);

    // Логируем действие
    console.log(`Администратор снял ${points} баллов с пользователя ${userId}${reason ? ` (причина: ${reason})` : ''}`);
    if (earnedAchievements.length > 0) {
      console.log(`Пользователь ${userId} получил достижения:`, earnedAchievements.map(a => a.title));
    }

    res.json({ 
      message: `Успешно снято ${points} баллов с пользователя`,
      user: userResult.rows[0].first_name + ' ' + userResult.rows[0].last_name,
      earnedAchievements: earnedAchievements
    });
  } catch (error) {
    console.error('Ошибка снятия баллов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Установка баллов администратора для пользователя
router.put('/users/:userId/points/set-admin', [
  adminAuth,
  body('points').isInt({ min: 0 }).withMessage('Количество баллов должно быть неотрицательным числом'),
  body('reason').optional().isString().withMessage('Причина должна быть строкой')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { points, reason } = req.body;

    // Проверяем, что пользователь существует
    const userResult = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Устанавливаем admin_points
    await db.query(`
      UPDATE users 
      SET admin_points = ?
      WHERE id = ?
    `, [points, userId]);

    // Пересчитываем общие баллы
    await recalculateUserPoints(userId);

    // Проверяем достижения после изменения баллов
    const earnedAchievements = await AchievementChecker.checkAfterPointsEarned(userId);

    // Логируем действие
    console.log(`Администратор установил ${points} admin_points пользователю ${userId}${reason ? ` (причина: ${reason})` : ''}`);
    if (earnedAchievements.length > 0) {
      console.log(`Пользователь ${userId} получил достижения:`, earnedAchievements.map(a => a.title));
    }

    res.json({ 
      message: `Успешно установлено ${points} баллов от администратора для пользователя`,
      user: userResult.rows[0].first_name + ' ' + userResult.rows[0].last_name,
      earnedAchievements: earnedAchievements
    });
  } catch (error) {
    console.error('Ошибка установки баллов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление баллов пользователя (для совместимости с frontend)
router.post('/users/:userId/update-points', [
  adminAuth,
  body('points').isInt().withMessage('Количество баллов должно быть числом')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { points } = req.body;

    // Проверяем, что пользователь существует
    const userResult = await db.query('SELECT admin_points, first_name, last_name FROM users WHERE id = ?', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const currentAdminPoints = userResult.rows[0].admin_points || 0;
    const newAdminPoints = currentAdminPoints + points;

    // Обновляем только admin_points
    await db.query('UPDATE users SET admin_points = ? WHERE id = ?', [newAdminPoints, userId]);

    // Пересчитываем общие баллы (функция сама посчитает total_earned_points)
    await recalculateUserPoints(userId);

    // Проверяем достижения после изменения баллов
    const earnedAchievements = await AchievementChecker.checkAfterPointsEarned(userId);

    // Логируем действие
    console.log(`Администратор ${points >= 0 ? 'добавил' : 'снял'} ${Math.abs(points)} баллов пользователю ${userId} (admin_points: ${currentAdminPoints} → ${newAdminPoints})`);
    if (earnedAchievements.length > 0) {
      console.log(`Пользователь ${userId} получил достижения:`, earnedAchievements.map(a => a.title));
    }

    res.json({ 
      message: `Успешно ${points >= 0 ? 'добавлено' : 'списано'} ${Math.abs(points)} баллов`,
      user: userResult.rows[0].first_name + ' ' + userResult.rows[0].last_name,
      adminPoints: newAdminPoints,
      earnedAchievements: earnedAchievements
    });
  } catch (error) {
    console.error('Ошибка обновления баллов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;