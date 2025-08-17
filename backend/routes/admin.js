const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { adminAuth } = require('../middleware/auth');

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
    let query = 'SELECT id, login, first_name, last_name, class_grade, class_letter, role, created_at FROM users';
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

// Обновление пользователя
router.put('/users/:id', [
  adminAuth,
  body('login').optional().isLength({ min: 3, max: 50 }),
  body('first_name').optional().notEmpty(),
  body('last_name').optional().notEmpty(),
  body('role').optional().isIn(['student', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.id;
    const { login, first_name, last_name, class_grade, class_letter, role } = req.body;

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

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    if (updates.length > 1) { // Больше 1, потому что updated_at всегда добавляется
      await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
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

function generateUsersCSV(users) {
    const header = 'ID,Логин,Имя,Фамилия,Класс,Роль,Участие в событиях,Достижения,Дата создания\n';
  const rows = users.map(user => 
    `${user.id},"${user.login}","${user.first_name}","${user.last_name}","${user.class_grade || ''}${user.class_letter || ''}","${user.role}",${user.events_count},${user.achievements_count},"${user.created_at}"`
  ).join('\n');
  return header + rows;
}

module.exports = router;