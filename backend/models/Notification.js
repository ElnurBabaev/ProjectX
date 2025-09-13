const db = require('../config/database');

const Notification = {
  // Создание уведомления
  async create(userId, type, title, message, relatedId = null) {
    const result = await db.query(
      'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, relatedId]
    );
    return result.insertId;
  },

  // Получение уведомлений пользователя
  async findByUserId(userId, limit = 50, offset = 0) {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    return result.rows;
  },

  // Получение непрочитанных уведомлений
  async findUnreadByUserId(userId) {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  // Отметить уведомление как прочитанное
  async markAsRead(notificationId, userId) {
    const result = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  },

  // Отметить все уведомления пользователя как прочитанные
  async markAllAsRead(userId) {
    const result = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result.affectedRows;
  },

  // Получение уведомления по ID
  async findById(notificationId, userId) {
    const result = await db.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.rows[0] || null;
  },

  // Удаление уведомления
  async delete(notificationId, userId) {
    const result = await db.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  },

  // Получение количества непрочитанных уведомлений
  async getUnreadCount(userId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result.rows[0].count;
  }
};

module.exports = Notification;