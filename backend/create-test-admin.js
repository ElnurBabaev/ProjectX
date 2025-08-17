const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Ошибка:', err);
    return;
  }
  
  console.log('🔧 Создаем тестового администратора...');
  
  // Проверяем, есть ли уже admin
  db.get('SELECT id FROM users WHERE login = "admin"', (err, row) => {
    if (err) {
      console.error('Ошибка:', err);
      db.close();
      return;
    }
    
    if (row) {
      console.log('✅ Администратор admin уже существует');
      
      // Обновляем пароль на 'admin' для тестирования
      const hashedPassword = bcrypt.hashSync('admin', 12);
      db.run('UPDATE users SET password = ? WHERE login = "admin"', [hashedPassword], (err) => {
        if (err) {
          console.error('Ошибка обновления пароля:', err);
        } else {
          console.log('🔑 Пароль администратора обновлен на "admin"');
        }
        db.close();
      });
    } else {
      // Создаем нового администратора
      const hashedPassword = bcrypt.hashSync('admin', 12);
      
      db.run(`
        INSERT INTO users (login, password, first_name, last_name, role, class_grade, class_letter)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['admin', hashedPassword, 'Администратор', 'Системы', 'admin', 11, 'А'], (err) => {
        if (err) {
          console.error('Ошибка создания администратора:', err);
        } else {
          console.log('✅ Администратор создан успешно');
          console.log('📝 Логин: admin');
          console.log('🔑 Пароль: admin');
        }
        db.close();
      });
    }
  });
});