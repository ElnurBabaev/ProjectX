const database = require('../config/database-sqlite');

async function cleanupTestUsers() {
  try {
    console.log('🧹 Очистка тестовых пользователей...\n');

    // Список тестовых пользователей для удаления (по логину)
    const testUserLogins = [
      'test_student1',
      'test_student2', 
      'test_student3',
      'test_student4',
      'test_student5',
      'elnur',
      'elnur1'
    ];

    console.log('🗑️ Пользователи для удаления:');
    for (const login of testUserLogins) {
      const user = await database.query('SELECT id, login, first_name, last_name FROM users WHERE login = ?', [login]);
      if (user.rows.length > 0) {
        const u = user.rows[0];
        console.log(`- ${u.login}: ${u.first_name} ${u.last_name} (ID: ${u.id})`);
      }
    }

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\n❓ Удалить этих тестовых пользователей? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        try {
          console.log('\n🗑️ Удаление тестовых пользователей...');
          
          for (const login of testUserLogins) {
            // Сначала удаляем связанные данные (достижения пользователя)
            const userResult = await database.query('SELECT id FROM users WHERE login = ?', [login]);
            if (userResult.rows.length > 0) {
              const userId = userResult.rows[0].id;
              
              // Удаляем достижения пользователя
              await database.query('DELETE FROM user_achievements WHERE user_id = ?', [userId]);
              
              // Удаляем регистрации на события
              await database.query('DELETE FROM event_registrations WHERE user_id = ?', [userId]);
              
              // Удаляем заказы
              await database.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)', [userId]);
              await database.query('DELETE FROM orders WHERE user_id = ?', [userId]);
              
              // Удаляем самого пользователя
              await database.query('DELETE FROM users WHERE login = ?', [login]);
              
              console.log(`✅ Удален пользователь: ${login}`);
            }
          }

          console.log('\n🎉 Тестовые пользователи успешно удалены!');
          
          // Показываем обновленный список пользователей
          const remainingUsers = await database.query(`
            SELECT login, first_name, last_name, class_grade, class_letter, role 
            FROM users 
            ORDER BY role DESC, last_name
          `);
          
          console.log('\n=== ОСТАВШИЕСЯ ПОЛЬЗОВАТЕЛИ ===');
          remainingUsers.rows.forEach(user => {
            console.log(`${user.login}: ${user.first_name} ${user.last_name} (${user.class_grade}${user.class_letter}) - ${user.role}`);
          });

        } catch (error) {
          console.error('❌ Ошибка при удалении:', error);
        }
      } else {
        console.log('❌ Операция отменена.');
      }
      
      rl.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Ошибка при очистке пользователей:', error);
    process.exit(1);
  }
}

cleanupTestUsers();