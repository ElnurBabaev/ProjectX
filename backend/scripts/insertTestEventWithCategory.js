const db = require('../config/database-sqlite');

(async () => {
  try {
    const now = new Date().toISOString();
    const title = 'Тест вставки категории';
    const category = 'спорт';

    const insert = await db.query(`INSERT INTO events (title, description, start_date, category, location, max_participants, points, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, 'desc', now, category, 'Место', 10, 5, 1]);

    console.log('insertId:', insert.insertId);

    const rows = await db.query('SELECT id, title, category FROM events WHERE id = ?', [insert.insertId]);
    console.log('inserted row:', rows.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await db.close();
  }
})();
