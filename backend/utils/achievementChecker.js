const db = require('../config/database');
const { recalculateUserPoints } = require('./pointsCalculator');
const Notification = require('../models/Notification');

class AchievementChecker {
  // Проверить все условия достижений для пользователя
  static async checkAllAchievements(userId) {
    try {
      console.log(`Checking achievements for user ${userId}`);

      // Получаем все достижения с условиями, которые пользователь еще не получил
      const achievementsResult = await db.query(`
        SELECT a.* FROM achievements a
        WHERE a.requirements IS NOT NULL 
        AND a.requirements != ''
        AND a.id NOT IN (
          SELECT achievement_id FROM user_achievements WHERE user_id = ?
        )
      `, [userId]);

      const achievements = achievementsResult.rows;
      console.log(`Found ${achievements.length} achievements to check:`, achievements.map(a => a.title));

      const earnedAchievements = [];

      for (const achievement of achievements) {
        const isEarned = await this.checkAchievementCondition(userId, achievement);
        console.log(`Achievement "${achievement.title}": ${isEarned ? 'earned' : 'not earned'}`);
        if (isEarned) {
          await this.awardAchievement(userId, achievement.id, 'Автоматически назначено системой');
          earnedAchievements.push(achievement);
        }
      }

      return earnedAchievements;
    } catch (error) {
      console.error('Ошибка проверки достижений:', error);
      return [];
    }
  }

  // Проверить конкретное условие достижения
  static async checkAchievementCondition(userId, achievement) {
    const requirements = achievement.requirements.toLowerCase();
    console.log(`Checking condition for "${achievement.title}": "${requirements}"`);

    try {
      // Участие в мероприятиях
      if (requirements.includes('участие') && requirements.includes('мероприятии')) {
        const eventCount = await this.getEventParticipationCount(userId);
        console.log(`User ${userId} has ${eventCount} event participations`);
        
        // Ищем числа в требованиях
        const numbers = requirements.match(/\d+/g);
        const requiredCount = numbers ? parseInt(numbers[0]) : 1;
        console.log(`Required: ${requiredCount}`);
        
        return eventCount >= requiredCount;
      }

      // Заработанные баллы
      if (requirements.includes('балл') || requirements.includes('очк')) {
        const userPointsResult = await db.query('SELECT total_earned_points FROM users WHERE id = ?', [userId]);
        const userPoints = userPointsResult.rows[0]?.total_earned_points || 0;
        console.log(`User ${userId} has ${userPoints} total earned points`);
        
        const numbers = requirements.match(/\d+/g);
        const requiredPoints = numbers ? parseInt(numbers[0]) : 50;
        console.log(`Required points: ${requiredPoints}`);
        
        return userPoints >= requiredPoints;
      }

      // Количество достижений
      if (requirements.includes('достижени')) {
        const achievementCount = await this.getUserAchievementCount(userId);
        
        const numbers = requirements.match(/\d+/g);
        const requiredCount = numbers ? parseInt(numbers[0]) : 3;
        
        return achievementCount >= requiredCount;
      }

      // Покупки в магазине
      if (requirements.includes('покупк') || requirements.includes('товар')) {
        const purchaseCount = await this.getPurchaseCount(userId);
        
        const numbers = requirements.match(/\d+/g);
        const requiredCount = numbers ? parseInt(numbers[0]) : 1;
        
        return purchaseCount >= requiredCount;
      }

      // Первое действие (регистрация, первое мероприятие и т.д.)
      if (requirements.includes('перв')) {
        if (requirements.includes('мероприятии') || requirements.includes('участие')) {
          return await this.getEventParticipationCount(userId) >= 1;
        }
      }

      return false;
    } catch (error) {
      console.error('Ошибка проверки условия достижения:', error);
      return false;
    }
  }

  // Получить количество участий в мероприятиях
  static async getEventParticipationCount(userId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM event_registrations WHERE user_id = ? AND status = "attended"', 
      [userId]
    );
    const count = result.rows[0]?.count || 0;
    console.log(`Event participation count for user ${userId}: ${count}`);
    return count;
  }

  // Получить количество достижений пользователя
  static async getUserAchievementCount(userId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?', 
      [userId]
    );
    return result.rows[0]?.count || 0;
  }

  // Получить количество покупок пользователя
  static async getPurchaseCount(userId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status != "cancelled"', 
      [userId]
    );
    return result.rows[0]?.count || 0;
  }

  // Назначить достижение пользователю
  static async awardAchievement(userId, achievementId, notes = '') {
    try {
      // Проверяем, что достижение еще не назначено
      const existingResult = await db.query(
        'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievementId]
      );

      if (existingResult.rows.length > 0) {
        return false; // Уже назначено
      }

      // Получаем информацию о достижении для уведомления
      const achievementResult = await db.query(
        'SELECT title, points FROM achievements WHERE id = ?',
        [achievementId]
      );

      if (achievementResult.rows.length === 0) {
        console.error('Достижение не найдено:', achievementId);
        return false;
      }

      const achievement = achievementResult.rows[0];

      // Назначаем достижение
      await db.query(
        'INSERT INTO user_achievements (user_id, achievement_id, notes) VALUES (?, ?, ?)',
        [userId, achievementId, notes]
      );

      // Пересчитываем общие баллы пользователя
      await recalculateUserPoints(userId);

      // Создаем уведомление о новом достижении
      await Notification.create(
        userId,
        'achievement_earned',
        `🏆 Новое достижение: ${achievement.title}`,
        `Поздравляем! Вы получили достижение "${achievement.title}" и заработали ${achievement.points} баллов.`,
        achievementId
      );

      console.log(`Уведомление о достижении "${achievement.title}" отправлено пользователю ${userId}`);

      return true;
    } catch (error) {
      console.error('Ошибка назначения достижения:', error);
      return false;
    }
  }

  // Проверить достижения после участия в мероприятии
  static async checkAfterEventParticipation(userId) {
    return await this.checkAllAchievements(userId);
  }

  // Проверить достижения после покупки
  static async checkAfterPurchase(userId) {
    return await this.checkAllAchievements(userId);
  }

  // Проверить достижения после получения баллов
  static async checkAfterPointsEarned(userId) {
    return await this.checkAllAchievements(userId);
  }
}

module.exports = AchievementChecker;