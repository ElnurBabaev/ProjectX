const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, adminAuth } = require('../middleware/auth');
const { Notification } = require('../models');

const router = express.Router();

// Получение уведомлений пользователя
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const notifications = await Notification.findByUserId(userId, limit, offset);

    res.json({ notifications });
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение непрочитанных уведомлений
router.get('/unread', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findUnreadByUserId(userId);
    const count = await Notification.getUnreadCount(userId);

    res.json({
      notifications,
      unreadCount: count
    });
  } catch (error) {
    console.error('Ошибка получения непрочитанных уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отметить уведомление как прочитанное
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const success = await Notification.markAsRead(notificationId, userId);

    if (!success) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    res.json({ message: 'Уведомление отмечено как прочитанное' });
  } catch (error) {
    console.error('Ошибка отметки уведомления как прочитанного:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отметить все уведомления как прочитанные
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const affectedRows = await Notification.markAllAsRead(userId);

    res.json({
      message: 'Все уведомления отмечены как прочитанные',
      updatedCount: affectedRows
    });
  } catch (error) {
    console.error('Ошибка отметки всех уведомлений как прочитанных:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление уведомления
router.delete('/:id', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const success = await Notification.delete(notificationId, userId);

    if (!success) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    res.json({ message: 'Уведомление удалено' });
  } catch (error) {
    console.error('Ошибка удаления уведомления:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// АДМИНИСТРАТИВНЫЕ МАРШРУТЫ

// Получение всех уведомлений (для админа)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    // Получаем уведомления с данными о заказе и пользователе, который сделал заказ
    const result = await db.query(`
      SELECT
        n.*,
        o.user_id as order_user_id,
        u.first_name,
        u.last_name,
        u.class_grade,
        u.class_letter
      FROM notifications n
      LEFT JOIN orders o ON n.related_id = o.id AND n.type IN ('order_created', 'order_confirmed', 'order_cancelled')
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Ошибка получения всех уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание системного уведомления (для админа)
router.post('/admin/system', [
  adminAuth,
  body('userIds').isArray({ min: 1 }).withMessage('Необходимо указать получателей'),
  body('userIds.*').isInt({ min: 1 }).withMessage('Неверный ID пользователя'),
  body('title').notEmpty().withMessage('Заголовок обязателен'),
  body('message').notEmpty().withMessage('Сообщение обязательно')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userIds, title, message } = req.body;
    const createdNotifications = [];

    for (const userId of userIds) {
      const notificationId = await Notification.create(userId, 'system', title, message);
      createdNotifications.push(notificationId);
    }

    res.status(201).json({
      message: 'Системные уведомления созданы',
      createdCount: createdNotifications.length
    });
  } catch (error) {
    console.error('Ошибка создания системных уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;