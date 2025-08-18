const db = require('../config/database-sqlite');

async function ensureColumn(table, column, sqlAdd) {
  // Use SELECT pragma_table_info to get rows via .all()
  const info = await db.query(`SELECT name FROM pragma_table_info(?)`, [table]);
  const exists = info.rows.some(r => r.name === column);
  if (!exists) {
    await db.query(sqlAdd);
    console.log(`Added ${column} to ${table}`);
  } else {
    console.log(`Column ${table}.${column} already exists`);
  }
}

async function run() {
  try {
    // events.points
    await ensureColumn('events', 'points', 'ALTER TABLE events ADD COLUMN points INTEGER DEFAULT 0');
    // event_registrations.points_awarded
    await ensureColumn('event_registrations', 'points_awarded', 'ALTER TABLE event_registrations ADD COLUMN points_awarded INTEGER DEFAULT 0');
    // users.admin_points
    await ensureColumn('users', 'admin_points', 'ALTER TABLE users ADD COLUMN admin_points INTEGER DEFAULT 0');
    // users.total_earned_points
    await ensureColumn('users', 'total_earned_points', 'ALTER TABLE users ADD COLUMN total_earned_points INTEGER DEFAULT 0');
    // users.points (available)
    await ensureColumn('users', 'points', 'ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0');

    console.log('Schema ensured');
    process.exit(0);
  } catch (e) {
    console.error('Migration error:', e);
    process.exit(1);
  }
}

if (require.main === module) run();

module.exports = { run };
