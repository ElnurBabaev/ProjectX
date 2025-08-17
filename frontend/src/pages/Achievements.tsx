import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, Calendar, Target } from 'lucide-react';
import { achievementsApi } from '../utils/api';
import { Achievement } from '../utils/types';
import toast from 'react-hot-toast';

const Achievements: React.FC = () => {
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [myAchievements, setMyAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const [allResponse, myResponse] = await Promise.all([
        achievementsApi.getAll(),
        achievementsApi.getMy()
      ]);
      
      setAllAchievements(allResponse.data);
      setMyAchievements(myResponse.data);
    } catch (error) {
      toast.error('Ошибка загрузки достижений');
    } finally {
      setLoading(false);
    }
  };

  const isEarned = (achievementId: number) => {
    return myAchievements.some(achievement => achievement.id === achievementId);
  };

  const getEarnedDate = (achievementId: number) => {
    const earned = myAchievements.find(achievement => achievement.id === achievementId);
    return earned?.earned_at;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getConditionText = (conditionType: string, conditionValue: number) => {
    switch (conditionType) {
      case 'points':
        return `Набрать ${conditionValue} баллов`;
      case 'events':
        return `Участвовать в ${conditionValue} мероприятиях`;
      default:
        return 'Особое условие';
    }
  };

  const getConditionIcon = (conditionType: string) => {
    switch (conditionType) {
      case 'points':
        return Star;
      case 'events':
        return Calendar;
      default:
        return Target;
    }
  };

  const achievementsToShow = activeTab === 'earned' ? myAchievements : allAchievements;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка достижений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-text mb-4">
              🏆 Достижения
            </h1>
            <p className="text-gray-600 text-lg">
              Получайте награды за активное участие в школьной жизни!
            </p>
            
            {/* Stats */}
            <div className="flex justify-center space-x-8 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {myAchievements.length}
                </div>
                <div className="text-sm text-gray-600">Получено</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {allAchievements.length - myAchievements.length}
                </div>
                <div className="text-sm text-gray-600">Доступно</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {Math.round((myAchievements.length / allAchievements.length) * 100) || 0}%
                </div>
                <div className="text-sm text-gray-600">Прогресс</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm hover:shadow-md'
              }`}
            >
              Все достижения
            </button>
            <button
              onClick={() => setActiveTab('earned')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'earned'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm hover:shadow-md'
              }`}
            >
              Мои награды ({myAchievements.length})
            </button>
          </div>
        </motion.div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievementsToShow.map((achievement, index) => {
            const earned = isEarned(achievement.id);
            const earnedDate = getEarnedDate(achievement.id);
            const ConditionIcon = getConditionIcon(achievement.condition_type);
            
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  earned
                    ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 border-2 border-yellow-200 shadow-lg'
                    : 'bg-white/80 backdrop-blur-lg border border-gray-100 shadow-md'
                }`}
              >
                {/* Earned Badge */}
                {earned && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white rounded-full p-2">
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* Achievement Icon */}
                <div className="text-center mb-4">
                  <div className={`text-6xl mb-2 ${earned ? 'animate-bounce' : ''}`}>
                    {achievement.icon}
                  </div>
                  <h3 className={`text-xl font-bold ${
                    earned ? 'text-yellow-800' : 'text-gray-800'
                  }`}>
                    {achievement.title}
                  </h3>
                </div>

                {/* Description */}
                <p className={`text-center mb-4 ${
                  earned ? 'text-yellow-700' : 'text-gray-600'
                }`}>
                  {achievement.description}
                </p>

                {/* Condition */}
                <div className={`flex items-center justify-center p-3 rounded-xl mb-4 ${
                  earned 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  <ConditionIcon className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    {getConditionText(achievement.condition_type, achievement.condition_value)}
                  </span>
                </div>

                {/* Earned Date */}
                {earned && earnedDate && (
                  <div className="text-center">
                    <div className="flex items-center justify-center text-yellow-700">
                      <Award className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">
                        Получено {formatDate(earnedDate)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Glow effect for earned achievements */}
                {earned && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20 animate-pulse"></div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {achievementsToShow.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {activeTab === 'earned' ? 'У вас пока нет достижений' : 'Достижений не найдено'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'earned' 
                ? 'Участвуйте в мероприятиях и зарабатывайте баллы, чтобы получить первые награды!'
                : 'В данный момент достижения недоступны'
              }
            </p>
          </motion.div>
        )}

        {/* Progress Indicator */}
        {allAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Общий прогресс достижений
              </h4>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${(myAchievements.length / allAchievements.length) * 100}%` 
                  }}
                ></div>
              </div>
              <p className="text-gray-600">
                {myAchievements.length} из {allAchievements.length} достижений получено
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Achievements;