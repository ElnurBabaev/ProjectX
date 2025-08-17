const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'school_events',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

function normalizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    login: row.login,
    firstName: row.first_name,
    lastName: row.last_name,
    classGrade: row.class_grade,
    classLetter: row.class_letter,
    personalPoints: row.personal_points ?? 0,
    role: row.is_admin ? 'admin' : 'student',
    isAdmin: !!row.is_admin,
    createdAt: row.created_at,
  };
}

// Отдельная функция для аутентификации с паролем
function normalizeUserWithPassword(row) {
  if (!row) return null;
  return {
    id: row.id,
    login: row.login,
    password: row.password_hash, // добавляем поле password для аутентификации
    firstName: row.first_name,
    lastName: row.last_name,
    classGrade: row.class_grade,
    classLetter: row.class_letter,
    personalPoints: row.personal_points ?? 0,
    role: row.is_admin ? 'admin' : 'student',
    isAdmin: !!row.is_admin,
    createdAt: row.created_at,
  };
}

const User = {
  async findByLogin(login) {
    const result = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
    return normalizeUserWithPassword(result.rows[0]);
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
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
    const isAdmin = role === 'admin';

    const result = await pool.query(
      `INSERT INTO users (login, password_hash, first_name, last_name, class_grade, class_letter, personal_points, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [loginValue, hash, firstName, lastName, classGrade, classLetter, 0, isAdmin]
    );

    return normalizeUser(result.rows[0]);
  },

  async updatePassword(userId, newPassword) {
    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
    const hash = await bcrypt.hash(newPassword, rounds);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    return true;
  },

  async getClassPoints(grade, letter) {
    const result = await pool.query(
      'SELECT COALESCE(SUM(personal_points), 0) AS points FROM users WHERE class_grade = $1 AND class_letter = $2',
      [grade, letter]
    );
    return Number(result.rows[0]?.points || 0);
  },

  async getAllUsers() {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows.map(normalizeUser);
  },

  async updatePoints(userId, deltaPoints) {
    await pool.query(
      'UPDATE users SET personal_points = COALESCE(personal_points, 0) + $1 WHERE id = $2',
      [deltaPoints, userId]
    );
    return true;
  },

  async updateUser(userId, updates) {
    const fieldsMap = {
      login: 'login',
      firstName: 'first_name',
      lastName: 'last_name',
      classGrade: 'class_grade',
      classLetter: 'class_letter',
      role: 'is_admin', // преобразуем role -> is_admin
    };

    const sets = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (!(key in fieldsMap)) continue;
      let dbValue = value;
      if (key === 'role') {
        dbValue = value === 'admin';
      }
      sets.push(`${fieldsMap[key]} = $${idx++}`);
      values.push(dbValue);
    }

    if (sets.length === 0) return false;
    values.push(userId);
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, values);
    return true;
  },

  async deleteUser(userId) {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    return true;
  }
};

const Achievement = {
  async getAll() {
    const result = await pool.query('SELECT * FROM achievements');
    return result.rows;
  }
};

const Event = {
  async getAll() {
    const result = await pool.query('SELECT * FROM events ORDER BY start_date DESC');
    return result.rows;
  },

  // Aliases and helpers for routes compatibility (minimal set)
  async findById(eventId) {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    return result.rows[0] || null;
  },

  async getUserEvents(userId) {
    // join registrations for the user
    const result = await pool.query(
      `SELECT e.*, er.registered_at, er.confirmed_at, er.points_awarded, er.status
       FROM events e
       JOIN event_registrations er ON er.event_id = e.id
       WHERE er.user_id = $1
       ORDER BY e.start_date DESC`,
      [userId]
    );
    return result.rows;
  },

  async registerParticipant(eventId, userId) {
    // respect unique constraint; insert if not exists
    try {
      const insert = await pool.query(
        `INSERT INTO event_registrations (user_id, event_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, event_id) DO NOTHING
         RETURNING *`,
        [userId, eventId]
      );
      return insert.rows[0] || null;
    } catch (e) {
      return null;
    }
  },

  async getPendingParticipants() {
    const result = await pool.query(
      `SELECT er.*, u.first_name, u.last_name, e.title
       FROM event_registrations er
       JOIN users u ON u.id = er.user_id
       JOIN events e ON e.id = er.event_id
       WHERE er.status = 'registered'`
    );
    return result.rows;
  },

  async confirmParticipation(eventId, userId) {
    const result = await pool.query(
      `UPDATE event_registrations
       SET status = 'confirmed', confirmed_at = NOW()
       WHERE event_id = $1 AND user_id = $2
       RETURNING *`,
      [eventId, userId]
    );
    return result.rows[0] || null;
  },

  async getParticipants(eventId) {
    const result = await pool.query(
      `SELECT u.* FROM event_registrations er
       JOIN users u ON u.id = er.user_id
       WHERE er.event_id = $1`,
      [eventId]
    );
    return result.rows.map(normalizeUser);
  },

  async getAllEvents() {
    // alias for admin statistics
    const result = await pool.query('SELECT * FROM events ORDER BY start_date DESC');
    return result.rows;
  }
};

const Product = {
  async getAll() {
    const result = await pool.query('SELECT * FROM products');
    return result.rows;
  }
};

module.exports = { User, Event, Product, Achievement };
