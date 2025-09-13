const database = require('../config/database');

function normalizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    login: row.login,
    firstName: row.first_name,
    lastName: row.last_name,
    classGrade: row.class_grade,
    classLetter: row.class_letter,
    totalEarnedPoints: row.total_earned_points ?? 0,
    points: row.points ?? 0, // доступные баллы
    role: row.role || 'student',
    isAdmin: row.role === 'admin',
    createdAt: row.created_at,
  };
}

// Отдельная функция для аутентификации с паролем
function normalizeUserWithPassword(row) {
  if (!row) return null;
  return {
    id: row.id,
    login: row.login,
    password: row.password, // исправлено с password_hash на password
    firstName: row.first_name,
    lastName: row.last_name,
    classGrade: row.class_grade,
    classLetter: row.class_letter,
    totalEarnedPoints: row.total_earned_points ?? 0,
    points: row.points ?? 0,
    role: row.role || 'student',
    isAdmin: row.role === 'admin',
    createdAt: row.created_at,
  };
}

const User = {
  async findByLogin(login) {
    const result = await database.query('SELECT * FROM users WHERE login = ?', [login]);
    return normalizeUserWithPassword(result.rows[0]);
  },

  async findById(id) {
    const result = await database.query('SELECT * FROM users WHERE id = ?', [id]);
    return normalizeUser(result.rows[0]);
  },

  async verifyPassword(plain, hash) {
    if (!hash) return false;
    return bcrypt.compare(plain, hash);
  },

  async create({ login, password, firstName, lastName, classGrade, classLetter, role }) {
    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
    const hash = await bcrypt.hash(password, rounds);
    const loginValue = login;
    const userRole = role || 'student';

    const result = await database.query(
      'INSERT INTO users (login, password, first_name, last_name, class_grade, class_letter, total_earned_points, points, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [loginValue, hash, firstName, lastName, classGrade, classLetter, 0, 0, userRole]
    );

    // Получить созданного пользователя
    const userResult = await database.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    return normalizeUser(userResult.rows[0]);
  },

  async updatePassword(userId, newPassword) {
    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
    const hash = await bcrypt.hash(newPassword, rounds);
    await database.query('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
    return true;
  },

  async getClassPoints(grade, letter) {
    const result = await database.query(
      'SELECT COALESCE(SUM(total_earned_points), 0) AS points FROM users WHERE class_grade = ? AND class_letter = ?',
      [grade, letter]
    );
    return Number(result.rows[0]?.points || 0);
  },

  async getAllUsers() {
    const result = await database.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows.map(normalizeUser);
  },

  async updatePoints(userId, deltaPoints) {
    // Используем новую систему: обновляем total_earned_points и пересчитываем available
    await database.query(
      'UPDATE users SET total_earned_points = COALESCE(total_earned_points, 0) + ? WHERE id = ?',
      [deltaPoints, userId]
    );
    
    // Пересчитываем доступные баллы
    const { recalculateUserPoints } = require('../utils/pointsCalculator');
    await recalculateUserPoints(userId);
    
    return true;
  },

  async updateUser(userId, updates) {
    const fieldsMap = {
      login: 'login',
      firstName: 'first_name',
      lastName: 'last_name',
      classGrade: 'class_grade',
      classLetter: 'class_letter',
      role: 'role',
      totalEarnedPoints: 'total_earned_points',
      points: 'points'
    };

    const sets = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (!(key in fieldsMap)) continue;
      sets.push(`${fieldsMap[key]} = ?`);
      values.push(value);
    }

    if (sets.length === 0) return false;
    values.push(userId);
    await database.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async deleteUser(userId) {
    await database.query('DELETE FROM users WHERE id = ?', [userId]);
    return true;
  }
};

const Achievement = {
  async getAll() {
    const result = await database.query('SELECT * FROM achievements');
    return result.rows;
  }
};

const Event = {
  async getAll() {
    const result = await database.query('SELECT * FROM events ORDER BY start_date DESC');
    return result.rows;
  },

  // Aliases and helpers for routes compatibility (minimal set)
  async findById(eventId) {
    const result = await database.query('SELECT * FROM events WHERE id = ?', [eventId]);
    return result.rows[0] || null;
  },

  async getUserEvents(userId) {
    // join registrations for the user
    const result = await database.query(
      'SELECT e.*, er.registered_at, er.confirmed_at, er.points_awarded, er.status FROM events e JOIN event_registrations er ON er.event_id = e.id WHERE er.user_id = ? ORDER BY e.start_date DESC',
      [userId]
    );
    return result.rows;
  },

  async registerParticipant(eventId, userId) {
    // respect unique constraint; insert if not exists
    try {
      const insert = await database.query(
        'INSERT OR IGNORE INTO event_registrations (user_id, event_id) VALUES (?, ?)',
        [userId, eventId]
      );
      if (insert.affectedRows > 0) {
        const result = await database.query('SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?', [userId, eventId]);
        return result.rows[0] || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  async getPendingParticipants() {
    const result = await database.query(
      'SELECT er.*, u.first_name, u.last_name, e.title FROM event_registrations er JOIN users u ON u.id = er.user_id JOIN events e ON e.id = er.event_id WHERE er.status = \'registered\''
    );
    return result.rows;
  },

  async confirmParticipation(eventId, userId) {
    const result = await database.query(
      'UPDATE event_registrations SET status = \'confirmed\', confirmed_at = datetime(\'now\') WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );
    if (result.affectedRows > 0) {
      const selectResult = await database.query('SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?', [eventId, userId]);
      return selectResult.rows[0] || null;
    }
    return null;
  },

  async getParticipants(eventId) {
    const result = await database.query(
      'SELECT u.* FROM event_registrations er JOIN users u ON u.id = er.user_id WHERE er.event_id = ?',
      [eventId]
    );
    return result.rows.map(normalizeUser);
  },

  async getAllEvents() {
    // alias for admin statistics
    const result = await database.query('SELECT * FROM events ORDER BY start_date DESC');
    return result.rows;
  }
};

const Product = {
  async getAll() {
    const result = await database.query('SELECT * FROM products');
    return result.rows;
  }
};

const Notification = require('./Notification');

module.exports = { User, Event, Product, Achievement, Notification };
