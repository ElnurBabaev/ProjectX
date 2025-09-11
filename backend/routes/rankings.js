const express = require('express');
const db = require('../config/database-sqlite');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Получение рейтинга учеников
router.get('/students', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.class_grade,
        u.class_letter,
        u.avatar_url,
        CAST(u.total_earned_points AS INTEGER) as total_points,
        COUNT(CASE WHEN er.status = 'attended' THEN 1 END) as events_participated,
        DENSE_RANK() OVER (ORDER BY u.total_earned_points DESC) as rank_position
      FROM users u
      LEFT JOIN event_registrations er ON u.id = er.user_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.first_name, u.last_name, u.class_grade, u.class_letter, u.avatar_url, u.total_earned_points
  ORDER BY u.total_earned_points DESC, u.last_name ASC
    `);

    // Найдем позицию текущего пользователя
    const currentUserRank = result.rows.find(student => student.id === req.user.id);

    res.json({
      rankings: result.rows,
      currentUser: currentUserRank || {
        id: req.user.id,
        rank_position: result.rows.length + 1,
        total_points: 0,
        events_participated: 0
      }
    });
  } catch (error) {
    console.error('Ошибка получения рейтинга учеников:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение рейтинга классов
router.get('/classes', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.class_grade,
        u.class_letter,
        CAST(COALESCE(SUM(u.total_earned_points), 0) AS INTEGER) as total_points,
        COUNT(DISTINCT u.id) as students_count,
        ROUND(COALESCE(SUM(u.total_earned_points), 0) / COUNT(DISTINCT u.id), 2) as avg_points_per_student,
        DENSE_RANK() OVER (ORDER BY COALESCE(SUM(u.total_earned_points), 0) DESC) as rank_position
      FROM users u
      WHERE u.role = 'student'
      GROUP BY u.class_grade, u.class_letter
      ORDER BY total_points DESC, u.class_grade DESC, u.class_letter ASC
    `);

    // Найдем позицию класса текущего пользователя
    const currentUserClass = result.rows.find(classData => 
      classData.class_grade === req.user.class_grade && 
      classData.class_letter === req.user.class_letter
    );

    res.json({
      rankings: result.rows,
      currentUserClass: currentUserClass || {
        class_grade: req.user.class_grade,
        class_letter: req.user.class_letter,
        rank_position: result.rows.length + 1,
        total_points: 0,
        students_count: 1,
        total_achievements: 0,
        avg_points_per_student: 0
      }
    });
  } catch (error) {
    console.error('Ошибка получения рейтинга классов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение топ-10 учеников
router.get('/top-students', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.class_grade,
        u.class_letter,
        u.avatar_url,
        CAST(u.total_earned_points AS INTEGER) as total_points,
        COUNT(CASE WHEN er.status = 'attended' THEN 1 END) as events_participated
      FROM users u
      LEFT JOIN event_registrations er ON u.id = er.user_id
      WHERE u.role = 'student'
  GROUP BY u.id, u.first_name, u.last_name, u.class_grade, u.class_letter, u.avatar_url, u.total_earned_points
  ORDER BY u.total_earned_points DESC, u.last_name ASC
      LIMIT 10
    `);

    res.json({ topStudents: result.rows });
  } catch (error) {
    console.error('Ошибка получения топ-10 учеников:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение рейтинга учеников по классу
router.get('/students/:grade/:letter', auth, async (req, res) => {
  try {
    const { grade, letter } = req.params;
    
    const result = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.class_grade,
        u.class_letter,
        u.avatar_url,
        CAST(u.total_earned_points AS INTEGER) as total_points,
        COUNT(CASE WHEN er.status = 'attended' THEN 1 END) as events_participated,
        DENSE_RANK() OVER (ORDER BY u.total_earned_points DESC) as rank_position
      FROM users u
      LEFT JOIN event_registrations er ON u.id = er.user_id
      WHERE u.role = 'student' AND u.class_grade = ? AND u.class_letter = ?
  GROUP BY u.id, u.first_name, u.last_name, u.class_grade, u.class_letter, u.avatar_url, u.total_earned_points
  ORDER BY u.total_earned_points DESC, u.last_name ASC
    `, [grade, letter]);

    res.json({ rankings: result.rows });
  } catch (error) {
    console.error('Ошибка получения рейтинга класса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение статистики для дашборда
router.get('/stats', auth, async (req, res) => {
  try {
    // Общая статистика
    const totalStudentsResult = await db.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'student'
    `);

    const totalClassesResult = await db.query(`
      SELECT COUNT(DISTINCT CONCAT(class_grade, class_letter)) as count 
      FROM users WHERE role = 'student'
    `);

    const totalPointsResult = await db.query(`
  SELECT CAST(COALESCE(SUM(total_earned_points), 0) AS INTEGER) as total_points
      FROM users 
      WHERE role = 'student'
    `);

    // Статистика текущего пользователя
    const userStatsResult = await db.query(`
      SELECT 
  CAST(u.total_earned_points AS INTEGER) as user_points,
  COUNT(CASE WHEN er.status = 'attended' THEN 1 END) as events_participated
      FROM users u
      LEFT JOIN event_registrations er ON u.id = er.user_id
      WHERE u.id = ?
  GROUP BY u.id, u.total_earned_points
    `, [req.user.id]);

    // Позиция пользователя в общем рейтинге
    const userRankResult = await db.query(`
      SELECT rank_position FROM (
        SELECT 
          u.id,
          DENSE_RANK() OVER (ORDER BY u.total_earned_points DESC) as rank_position
        FROM users u
        WHERE u.role = 'student'
      ) ranked
      WHERE id = ?
    `, [req.user.id]);

    // Позиция класса пользователя
    const classRankResult = await db.query(`
      SELECT rank_position FROM (
        SELECT 
          u.class_grade,
          u.class_letter,
          DENSE_RANK() OVER (ORDER BY COALESCE(SUM(u.total_earned_points), 0) DESC) as rank_position
        FROM users u
        WHERE u.role = 'student'
        GROUP BY u.class_grade, u.class_letter
      ) ranked
      WHERE class_grade = ? AND class_letter = ?
    `, [req.user.class_grade, req.user.class_letter]);

    res.json({
      totalStudents: totalStudentsResult.rows[0].count,
      totalClasses: totalClassesResult.rows[0].count,
      totalPoints: totalPointsResult.rows[0].total_points,
      userStats: {
        points: userStatsResult.rows[0]?.user_points || 0,
        eventsParticipated: userStatsResult.rows[0]?.events_participated || 0,
        rank: userRankResult.rows[0]?.rank_position || totalStudentsResult.rows[0].count,
        classRank: classRankResult.rows[0]?.rank_position || totalClassesResult.rows[0].count
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики рейтинга:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;