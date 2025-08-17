require('dotenv').config();
const db = require('../config/database');

(async () => {
  try {
    console.log('Connecting to Postgres...');
    const r1 = await db.query('SELECT current_database() as db, current_user as user');
    console.log(`Connected: db=${r1.rows[0].db}, user=${r1.rows[0].user}`);

    const tables = [
      'users',
      'events',
      'event_participants',
      'achievements',
      'user_achievements',
      'products',
      'purchases'
    ];

    for (const t of tables) {
      const res = await db.query(`SELECT COUNT(*)::int AS cnt FROM ${t}`);
      console.log(`  ${t}: ${res.rows[0].cnt}`);
    }

    process.exit(0);
  } catch (e) {
    console.error('PG check failed:', e.message);
    process.exit(1);
  }
})();
