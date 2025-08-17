const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Безопасные значения по умолчанию для разработки
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Регистрация - новая система без email
router.post('/register', [
  body('login').isLength({ min: 3, max: 50 }).withMessage('Логин должен быть от 3 до 50 символов'),
  body('password').isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
  body('firstName').notEmpty().withMessage('Имя обязательно'),
  body('lastName').notEmpty().withMessage('Фамилия обязательна'),
  body('classGrade').isInt({ min: 5, max: 11 }).withMessage('Класс должен быть от 5 до 11'),
  body('classLetter').isIn(['А', 'Б', 'В', 'Г']).withMessage('Буква класса должна быть А, Б, В или Г')
], async (req, res) => {
  try {
    console.log('📝 Запрос на регистрацию:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Ошибки валидации:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { login, password, firstName, lastName, classGrade, classLetter } = req.body;
    console.log('✅ Данные прошли валидацию:', { login, firstName, lastName, classGrade, classLetter });

    // Проверяем существующего пользователя только по логину
    const existingUser = await db.query(
      'SELECT id FROM users WHERE login = ?',
      [login]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('❌ Пользователь уже существует:', login);
      return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
    }

    console.log('✅ Пользователь не существует, создаем нового');

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Пароль захеширован');

    // Создаем пользователя с новой структурой
    const result = await db.query(
      'INSERT INTO users (login, password, first_name, last_name, class_grade, class_letter) VALUES (?, ?, ?, ?, ?, ?)',
      [login, hashedPassword, firstName, lastName, classGrade, classLetter]
    );

    console.log('✅ Пользователь создан с ID:', result.insertId);

    const userId = result.insertId;

    const token = jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: userId,
        login,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        class: `${classGrade}${classLetter}`,
        class_grade: classGrade,
        class_letter: classLetter,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// Авторизация - обновленная для новой системы
router.post('/login', [
  body('login').isLength({ min: 3, max: 50 }).withMessage('Введите логин'),
  body('password').notEmpty().withMessage('Пароль обязателен')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { login, password } = req.body;
    console.log('🔐 Попытка входа:', { login, hasPassword: !!password });

    const result = await db.query(
      'SELECT * FROM users WHERE login = ?',
      [login]
    );
    
    const user = result.rows[0];
    if (!user) {
      console.log('❌ Пользователь не найден:', login);
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }
    console.log('✅ Пользователь найден:', { id: user.id, login: user.login, hasHash: !!user.password });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Неверный пароль для пользователя:', login);
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    console.log('✅ Успешный вход пользователя:', { id: user.id, login: user.login });

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({
      message: 'Авторизация успешна',
      token,
      user: {
        id: user.id,
        login: user.login,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name} ${user.last_name}`,
        class: `${user.class_grade}${user.class_letter}`,
        class_grade: user.class_grade,
        class_letter: user.class_letter,
        role: user.role,
        isAdmin: user.role === 'admin',
        avatar_url: user.avatar_url,
        points: user.points || 0,
        total_earned_points: user.total_earned_points || 0
      }
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ message: 'Ошибка сервера при авторизации' });
  }
});

// Получение профиля - обновленное для новой структуры
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, login, first_name, last_name, class_grade, class_letter, role, avatar_url, points, total_earned_points, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Получаем количество достижений пользователя
    const achievementsResult = await db.query(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?',
      [user.id]
    );
    
    const achievementsCount = achievementsResult.rows[0].count;

    // Получаем количество событий, в которых участвовал пользователь
    const eventsResult = await db.query(
      'SELECT COUNT(*) as count FROM event_registrations WHERE user_id = ?',
      [user.id]
    );
    
    const eventsCount = eventsResult.rows[0].count;

    res.json({
      user: {
        id: user.id,
        login: user.login,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name} ${user.last_name}`,
        class: `${user.class_grade}${user.class_letter}`,
        class_grade: user.class_grade,
        class_letter: user.class_letter,
        role: user.role,
        isAdmin: user.role === 'admin',
        avatar_url: user.avatar_url,
        points: user.points || 0,
        total_earned_points: user.total_earned_points || 0,
        achievements_count: achievementsCount,
        events_count: eventsCount,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Смена пароля
router.post('/change-password', [
  auth,
  body('currentPassword').notEmpty().withMessage('Текущий пароль обязателен'),
  body('newPassword').isLength({ min: 6 }).withMessage('Новый пароль должен быть не менее 6 символов')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Получаем текущий пароль пользователя
    const result = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );
    
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Неверный текущий пароль' });
    }

    // Хешируем новый пароль
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Обновляем пароль
    await db.query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    res.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление профиля пользователя
router.put('/profile', [
  auth,
  body('first_name').optional().notEmpty().withMessage('Имя не может быть пустым'),
  body('last_name').optional().notEmpty().withMessage('Фамилия не может быть пустой'),
  body('avatar_id').optional().isString().withMessage('ID аватара должен быть строкой')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, class_grade, class_letter, avatar_id } = req.body;
    const userId = req.user.id;

    const updates = [];
    const params = [];

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
    if (avatar_id !== undefined) {
      updates.push('avatar_url = ?');
      params.push(avatar_id); // Сохраняем ID аватара в поле avatar_url
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Нет данных для обновления' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Получаем обновленные данные пользователя
    const result = await db.query(
      'SELECT id, login, first_name, last_name, class_grade, class_letter, role, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({ 
      message: 'Профиль обновлен', 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;