const db = require('./config/database');

async function testRankings() {
  try {
    const result = await db.query(`
      SELECT 
        u.first_name, 
        u.last_name, 
        u.total_points, 
        RANK() OVER (ORDER BY u.total_points DESC) as rank_position 
      FROM users u 
      WHERE u.role = 'student' 
      ORDER BY u.total_points DESC
    `);
    
    console.log('Рейтинг студентов:');
    result.rows.forEach(row => {
      console.log(`${row.rank_position}. ${row.first_name} ${row.last_name} - ${row.total_points} баллов`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

testRankings();