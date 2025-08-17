const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Нет токена авторизации' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await db.query(
      'SELECT id, login, first_name, last_name, class_grade, class_letter, role FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    // Добавляем вычисляемые поля для обратной совместимости
    user.full_name = `${user.first_name} ${user.last_name}`;
    user.class = `${user.class_grade}${user.class_letter}`;

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT auth error:', error.message);
    res.status(401).json({ message: 'Неверный токен' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ message: 'Ошибка авторизации администратора' });
  }
};

module.exports = { auth, adminAuth };