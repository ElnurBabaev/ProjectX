const db = require('../config/database');

/**
 * Пересчитывает балансы пользователя по новой модели:
 * total_earned_points = события(только подтвержденные) + достижения + admin_points
 * points (доступные) = total_earned_points - сумма покупок (не отмененных)
 * @param {number} userId
 * @returns {Promise<{totalEarned:number, available:number}>}
 */
async function recalculateUserPoints(userId) {
  try {
    // Баллы за подтвержденные участия в мероприятиях
    const eventsResult = await db.query(
      `SELECT COALESCE(SUM(e.points), 0) AS event_points
       FROM event_registrations er
       JOIN events e ON er.event_id = e.id
       WHERE er.user_id = ? AND er.status = 'attended'`,
      [userId]
    );

    // Баллы за достижения
    const achievementsResult = await db.query(
      `SELECT COALESCE(SUM(a.points), 0) AS achievement_points
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ?`,
      [userId]
    );

    // Баллы, назначенные администратором
    const adminPointsResult = await db.query(
      `SELECT COALESCE(admin_points, 0) AS admin_points
       FROM users WHERE id = ?`,
      [userId]
    );

    // Потрачено в магазине (все заказы, кроме отмененных)
    const spentResult = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS spent
       FROM orders
       WHERE user_id = ? AND status != 'cancelled'`,
      [userId]
    );

    const eventPoints = Number(eventsResult.rows[0]?.event_points || 0);
    const achievementPoints = Number(achievementsResult.rows[0]?.achievement_points || 0);
    const adminPoints = Number(adminPointsResult.rows[0]?.admin_points || 0);
    const spent = Number(spentResult.rows[0]?.spent || 0);

    const totalEarned = eventPoints + achievementPoints + adminPoints;
    const available = Math.max(0, totalEarned - spent);

    // Сохраняем рассчитанные значения
    await db.query(
      `UPDATE users
       SET total_earned_points = ?, points = ?
       WHERE id = ?`,
      [totalEarned, available, userId]
    );

    console.log(
      `Пересчет пользователя ${userId}: total_earned=${totalEarned} (events=${eventPoints}, achievements=${achievementPoints}, admin=${adminPoints}), spent=${spent}, available=${available}`
    );
    return { totalEarned, available };
  } catch (error) {
    console.error('Ошибка пересчета баллов пользователя:', error);
    throw error;
  }
}

/** Пересчет для всех студентов */
async function recalculateAllUserPoints() {
  try {
    const usersResult = await db.query(`SELECT id FROM users WHERE role = 'student'`);
    let updated = 0;
    for (const u of usersResult.rows) {
      await recalculateUserPoints(u.id);
      updated++;
    }
    console.log(`Пересчитаны баллы для ${updated} пользователей`);
    return updated;
  } catch (error) {
    console.error('Ошибка массового пересчета баллов:', error);
    throw error;
  }
}

/** Обновляем участников конкретного события */
async function updateUserPointsForEvent(eventId) {
  try {
    const participantsResult = await db.query(
      `SELECT DISTINCT user_id FROM event_registrations WHERE event_id = ? AND status = 'attended'`,
      [eventId]
    );
    for (const p of participantsResult.rows) {
      await recalculateUserPoints(p.user_id);
    }
    console.log(`Обновлены баллы для участников мероприятия ${eventId}`);
  } catch (error) {
    console.error('Ошибка обновления баллов участников мероприятия:', error);
    throw error;
  }
}

/** Обновляем баллы пользователя после изменения достижений */
async function updateUserPointsForAchievement(userId) {
  try {
    await recalculateUserPoints(userId);
    console.log(`Обновлены баллы пользователя ${userId} после изменения достижений`);
  } catch (error) {
    console.error('Ошибка обновления баллов после изменения достижений:', error);
    throw error;
  }
}

module.exports = {
  recalculateUserPoints,
  recalculateAllUserPoints,
  updateUserPointsForEvent,
  updateUserPointsForAchievement,
};