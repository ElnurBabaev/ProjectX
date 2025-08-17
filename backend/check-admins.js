const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Ошибка:', err);
    return;
  }
  
  console.log('🔍 Проверяем администраторов в системе...');
  
  db.all('SELECT login, first_name, last_name, role FROM users WHERE role = "admin"', (err, rows) => {
    if (err) {
      console.error('Ошибка запроса:', err);
    } else {
      console.log('👑 Администраторы:');
      rows.forEach(user => {
        console.log(`  - ${user.login} (${user.first_name} ${user.last_name})`);
      });
    }
    
    db.close();
  });
});