const AchievementChecker = require('./utils/achievementChecker');
const db = require('./config/database');

async function testPointsAndAchievements() {
  try {
    console.log('=== Тестируем автоматическую проверку достижений после начисления баллов ===');
    
    // Проверяем текущие баллы администратора
    const userResult = await db.query('SELECT points, total_earned_points FROM users WHERE id = 1');
    const user = userResult.rows[0];
    console.log('Текущие баллы администратора:', user.points);
    console.log('Всего заработано:', user.total_earned_points);
    
    // Проверяем, есть ли достижение "Миллионер" 
    const achievementResult = await db.query('SELECT * FROM achievements WHERE title = ?', ['Миллионер']);
    if (achievementResult.rows.length === 0) {
      console.log('Достижение "Миллионер" не найдено, создаем...');
      await db.query(
        'INSERT INTO achievements (title, description, icon, type, points, requirements, badge_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime())',
        ['Миллионер', 'Заработал 25000 баллов', '💰', 'excellence', 150, 'Заработай 25000 баллов', '#FFD700']
      );
    }
    
    // Добавляем 5000 баллов (имитируя API)
    const pointsToAdd = 5000;
    const newPoints = user.points + pointsToAdd;
    const newTotalEarned = user.total_earned_points + pointsToAdd;
    
    await db.query(
      'UPDATE users SET points = ?, total_earned_points = ? WHERE id = 1', 
      [newPoints, newTotalEarned]
    );
    
    console.log(`✅ Добавлено ${pointsToAdd} баллов. Новый баланс: ${newPoints}`);
    console.log(`✅ Новый total_earned_points: ${newTotalEarned}`);
    
    // Проверяем достижения (как в API)
    console.log('🏆 Проверяем достижения после начисления баллов...');
    const earnedAchievements = await AchievementChecker.checkAllAchievements(1);
    
    if (earnedAchievements.length > 0) {
      console.log(`✨ Найдено и выдано ${earnedAchievements.length} новых достижений:`);
      earnedAchievements.forEach(a => {
        console.log(`- ${a.title} (${a.points} баллов): ${a.requirements}`);
      });
    } else {
      console.log('📝 Новых достижений не найдено');
    }
    
    // Проверяем финальное состояние
    const finalUserResult = await db.query('SELECT points, total_earned_points FROM users WHERE id = 1');
    const finalUser = finalUserResult.rows[0];
    console.log('Финальные баллы:', finalUser.points);
    console.log('Финальный total_earned_points:', finalUser.total_earned_points);
    
  } catch (error) {
    console.error('Ошибка тестирования:', error);
  } finally {
    process.exit(0);
  }
}

testPointsAndAchievements();