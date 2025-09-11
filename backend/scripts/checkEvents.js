const db = require('../config/database-sqlite');

(async () => {
  try {
    const info = await db.query("PRAGMA table_info('events')");
    console.log('columns:', info.rows.map(r => r.name));

    const rows = await db.query('SELECT id, title, category FROM events LIMIT 5');
    console.log('rows:', rows.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await db.close();
  }
})();
