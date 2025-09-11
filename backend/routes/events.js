const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, adminAuth } = require('../middleware/auth');
const { recalculateUserPoints, updateUserPointsForEvent } = require('../utils/pointsCalculator');

const router = express.Router();

// Получение всех мероприятий
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, 
             (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as current_participants
      FROM events e 
      ORDER BY e.start_date ASC
    `);
    res.json({ events: result.rows });
  } catch (error) {
    console.error('Ошибка получения мероприятий:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение конкретного мероприятия
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }
    res.json({ event: result.rows[0] });
  } catch (error) {
    console.error('Ошибка получения мероприятия:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Регистрация на мероприятие
router.post('/:id/register', auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Проверяем существование мероприятия
    const eventResult = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }

    const event = eventResult.rows[0];

    // Проверяем, не зарегистрирован ли уже пользователь
    const existingResult = await db.query(
      'SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'Вы уже зарегистрированы на это мероприятие' });
    }

    // Проверяем лимит участников
    if (event.max_participants) {
      const participantsResult = await db.query(
        'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?',
        [eventId]
      );
      
      if (participantsResult.rows[0].count >= event.max_participants) {
        return res.status(400).json({ message: 'Достигнуто максимальное количество участников' });
      }
    }

    // Регистрируем пользователя
    await db.query(
      'INSERT INTO event_registrations (event_id, user_id, status) VALUES (?, ?, ?)',
      [eventId, userId, 'registered']
    );

    // Обновляем счетчик участников
    await db.query(
      'UPDATE events SET current_participants = current_participants + 1 WHERE id = ?',
      [eventId]
    );

  // Баллы не начисляются при регистрации, только после подтверждения

    res.json({ message: 'Успешно зарегистрированы на мероприятие' });
  } catch (error) {
    console.error('Ошибка регистрации на мероприятие:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отмена регистрации
router.delete('/:id/register', auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const result = await db.query(
      'DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Регистрация не найдена' });
    }

    // Обновляем счетчик участников
    await db.query(
      'UPDATE events SET current_participants = current_participants - 1 WHERE id = ?',
      [eventId]
    );

  // Пересчет не требуется, баллы начисляются только после подтверждения

    res.json({ message: 'Регистрация отменена' });
  } catch (error) {
    console.error('Ошибка отмены регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение мероприятий пользователя
router.get('/my/events', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, er.status as registration_status, er.registered_at
      FROM events e
      JOIN event_registrations er ON e.id = er.event_id
      WHERE er.user_id = ?
      ORDER BY e.start_date ASC
    `, [req.user.id]);
    
    res.json({ events: result.rows });
  } catch (error) {
    console.error('Ошибка получения мероприятий пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// АДМИНИСТРАТИВНЫЕ МАРШРУТЫ

// Создание мероприятия
router.post('/', [
  adminAuth,
  body('title').notEmpty().withMessage('Название мероприятия обязательно'),
  body('description').notEmpty().withMessage('Описание мероприятия обязательно'),
  body('start_date').isISO8601().withMessage('Неверный формат даты начала'),
  body('location').notEmpty().withMessage('Место проведения обязательно'),
  body('points').optional().isInt({ min: 0 }).withMessage('Количество баллов должно быть неотрицательным числом')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, start_date, end_date, location, max_participants, image_url, points, category } = req.body;
    
    const result = await db.query(`
      INSERT INTO events (title, description, start_date, category, end_date, location, max_participants, image_url, points, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description, start_date, category || null, end_date, location, max_participants || null, image_url || null, points || 10, req.user.id]);

    res.status(201).json({ 
      message: 'Мероприятие создано', 
      event: { 
        id: result.insertId, 
        title, 
        description, 
        start_date, 
        end_date, 
        location, 
        max_participants, 
        image_url,
        category: category || null
      } 
    });
  } catch (error) {
    console.error('Ошибка создания мероприятия:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление мероприятия
router.put('/:id', [
  adminAuth,
  body('title').notEmpty().withMessage('Название мероприятия обязательно'),
  body('description').notEmpty().withMessage('Описание мероприятия обязательно'),
  body('start_date').isISO8601().withMessage('Неверный формат даты начала'),
  body('location').notEmpty().withMessage('Место проведения обязательно'),
  body('points').optional().isInt({ min: 0 }).withMessage('Количество баллов должно быть неотрицательным числом')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

  console.log('PUT /events/:id called with id:', req.params.id);
  console.log('Request body:', req.body);

    const { title, description, start_date, end_date, location, max_participants, image_url, status, points, category } = req.body;
    
    const result = await db.query(`
      UPDATE events 
      SET title = ?, description = ?, start_date = ?, category = ?, end_date = ?, location = ?, max_participants = ?, image_url = ?, status = ?, points = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, description, start_date, category || null, end_date, location, max_participants || null, image_url || null, status || 'upcoming', points || 10, req.params.id]);

    console.log('Update result:', result);

    if (result.affectedRows === 0) {
      console.log('No rows affected, event not found');
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }

    // Если изменились баллы за мероприятие, пересчитываем баллы участников
    if (points !== undefined) {
      // При изменении количества баллов за мероприятие пересчитываем только тех, кто был отмечен как присутствовал
      await updateUserPointsForEvent(req.params.id);
    }

    res.json({ message: 'Мероприятие обновлено' });
  } catch (error) {
    console.error('Ошибка обновления мероприятия:', error);
    // Дополнительный лог для продакшена: покажем часть тела запроса (без секретов)
    try {
      const safeBody = { ...req.body };
      if (safeBody.image_url) safeBody.image_url = '[REDACTED]';
      console.error('Request body at error:', JSON.stringify(safeBody));
    } catch (e) {
      console.error('Ошибка при логировании тела запроса:', e.message);
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление мероприятия
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }

    res.json({ message: 'Мероприятие удалено' });
  } catch (error) {
    console.error('Ошибка удаления мероприятия:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение участников мероприятия (для админов)
router.get('/:id/participants', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.login, u.first_name, u.last_name, u.class_grade, u.class_letter, er.status, er.registered_at
      FROM users u
      JOIN event_registrations er ON u.id = er.user_id
      WHERE er.event_id = ?
      ORDER BY er.registered_at DESC
    `, [req.params.id]);

    res.json({ participants: result.rows });
  } catch (error) {
    console.error('Ошибка получения участников:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;