const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, adminAuth } = require('../middleware/auth');
const { updateUserPointsForAchievement, recalculateUserPoints } = require('../utils/pointsCalculator');

const router = express.Router();

// Получение всех достижений
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM achievements ORDER BY created_at DESC');
    res.json({ achievements: result.rows });
  } catch (error) {
    console.error('Ошибка получения достижений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение достижений пользователя
router.get('/my', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, ua.awarded_at, ua.notes
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.awarded_at DESC
    `, [req.user.id]);
    
    res.json({ achievements: result.rows });
  } catch (error) {
    console.error('Ошибка получения достижений пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение статистики достижений пользователя
router.get('/stats', auth, async (req, res) => {
  try {
    // Общее количество достижений
    const totalResult = await db.query('SELECT COUNT(*) as total FROM achievements');
    
    // Количество достижений пользователя
    const userResult = await db.query(`
      SELECT COUNT(*) as earned, 
             SUM(a.points) as total_points
      FROM user_achievements ua 
      JOIN achievements a ON ua.achievement_id = a.id 
      WHERE ua.user_id = ?
    `, [req.user.id]);

    // Последние достижения
    const recentResult = await db.query(`
      SELECT a.title, a.icon, a.badge_color, ua.awarded_at
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.awarded_at DESC
      LIMIT 5
    `, [req.user.id]);

    res.json({
      total_achievements: totalResult.rows[0].total,
      earned_achievements: userResult.rows[0].earned || 0,
      total_points: userResult.rows[0].total_points || 0,
      recent_achievements: recentResult.rows
    });
  } catch (error) {
    console.error('Ошибка получения статистики достижений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// АДМИНИСТРАТИВНЫЕ МАРШРУТЫ

// Создание достижения
router.post('/', [
  adminAuth,
  body('title').notEmpty().withMessage('Название достижения обязательно'),
  body('description').notEmpty().withMessage('Описание достижения обязательно'),
  body('icon').notEmpty().withMessage('Иконка достижения обязательна'),
  body('type').isIn(['participation', 'excellence', 'leadership', 'community']).withMessage('Неверный тип достижения'),
  body('points').optional().isInt({ min: 0 }).withMessage('Количество баллов должно быть неотрицательным числом')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, icon, type, points, requirements, badge_color } = req.body;
    
    const result = await db.query(`
      INSERT INTO achievements (title, description, icon, type, points, requirements, badge_color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, description, icon, type, points || 0, requirements || null, badge_color || '#3B82F6']);

    res.status(201).json({ 
      message: 'Достижение создано', 
      achievement: {
        id: result.insertId,
        title,
        description,
        icon,
        type,
        points: points || 0,
        requirements,
        badge_color: badge_color || '#3B82F6'
      }
    });
  } catch (error) {
    console.error('Ошибка создания достижения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление достижения
router.put('/:id', [
  adminAuth,
  body('title').notEmpty().withMessage('Название достижения обязательно'),
  body('description').notEmpty().withMessage('Описание достижения обязательно'),
  body('icon').notEmpty().withMessage('Иконка достижения обязательна'),
  body('type').isIn(['participation', 'excellence', 'leadership', 'community']).withMessage('Неверный тип достижения'),
  body('points').optional().isInt({ min: 0 }).withMessage('Количество баллов должно быть неотрицательным числом')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, icon, type, points, requirements, badge_color } = req.body;
    
    const result = await db.query(`
      UPDATE achievements 
      SET title = ?, description = ?, icon = ?, type = ?, points = ?, requirements = ?, badge_color = ?
      WHERE id = ?
    `, [title, description, icon, type, points || 0, requirements || null, badge_color || '#3B82F6', req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }

    // Если изменились баллы, пересчитываем баллы всех пользователей с этим достижением
    if (points !== undefined) {
      const usersWithAchievement = await db.query(
        'SELECT DISTINCT user_id FROM user_achievements WHERE achievement_id = ?',
        [req.params.id]
      );
      
      for (const userRecord of usersWithAchievement.rows) {
        await updateUserPointsForAchievement(userRecord.user_id);
      }
    }

    res.json({ message: 'Достижение обновлено' });
  } catch (error) {
    console.error('Ошибка обновления достижения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление достижения
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM achievements WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }

    res.json({ message: 'Достижение удалено' });
  } catch (error) {
    console.error('Ошибка удаления достижения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Присвоение достижения пользователю
router.post('/:achievementId/award/:userId', adminAuth, async (req, res) => {
  try {
    const { achievementId, userId } = req.params;
    const { notes } = req.body;

    // Проверяем, что достижение и пользователь существуют
    const achievementResult = await db.query('SELECT * FROM achievements WHERE id = ?', [achievementId]);
    const userResult = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (achievementResult.rows.length === 0) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем, что у пользователя еще нет этого достижения
    const existingResult = await db.query(
      'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'У пользователя уже есть это достижение' });
    }

    // Присваиваем достижение
    await db.query(
      'INSERT INTO user_achievements (user_id, achievement_id, notes) VALUES (?, ?, ?)',
      [userId, achievementId, notes || null]
    );

    // Пересчитываем баллы пользователя
    await recalculateUserPoints(userId);

    res.json({ message: 'Достижение успешно присвоено пользователю' });
  } catch (error) {
    console.error('Ошибка присвоения достижения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отзыв достижения у пользователя
router.delete('/:achievementId/revoke/:userId', adminAuth, async (req, res) => {
  try {
    const { achievementId, userId } = req.params;

    // Проверяем, что достижение у пользователя существует
    const existingResult = await db.query(
      'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: 'У пользователя нет этого достижения' });
    }

    // Отзываем достижение
    await db.query(
      'DELETE FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );

    // Пересчитываем баллы пользователя
    await recalculateUserPoints(userId);

    res.json({ message: 'Достижение успешно отозвано у пользователя' });
  } catch (error) {
    console.error('Ошибка отзыва достижения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;