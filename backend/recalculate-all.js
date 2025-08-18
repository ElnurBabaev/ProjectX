const { recalculateAllUserPoints } = require('./utils/pointsCalculator');

async function main() {
  try {
    console.log('Начинаем пересчет всех баллов...');
    await recalculateAllUserPoints();
    console.log('✅ Пересчет всех баллов завершен');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка:', err);
    process.exit(1);
  }
}

main();