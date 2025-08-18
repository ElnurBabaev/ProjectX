import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Trophy, ShoppingBag, Star, TrendingUp, BarChart3, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { productsApi } from '../utils/api';
import { Order } from '../utils/types';
import { useRankingStats, useTopStudents } from '../hooks/useRankings';

interface Activity {
  type: 'achievement' | 'event';
  title: string;
  points: number;
  created_at: string;
  action_type: string;
  icon?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Хуки для рейтинга
  const { data: rankingStats } = useRankingStats();
  const { data: topStudents } = useTopStudents();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersResponse, activitiesResponse] = await Promise.all([
        productsApi.getMyOrders(),
        api.get('/auth/recent-activity')
      ]);
      
      setOrders(ordersResponse.data || []);
      
  setActivities((activitiesResponse.data?.activities) || []);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setOrders([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Только что';
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'час' : diffInHours < 5 ? 'часа' : 'часов'} назад`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? 'день' : diffInDays < 5 ? 'дня' : 'дней'} назад`;
      } else {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      }
    }
  };

  const stats = [
    {
      title: 'Мои баллы',
      value: user?.points || 0,
      icon: Star,
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      title: 'Достижения',
      value: user?.achievements_count || 0,
      icon: Trophy,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Мероприятий',
      value: user?.events_count || 0,
      icon: Calendar,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Покупок',
      value: orders.length,
      icon: ShoppingBag,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ];

  const quickActions = [
    {
      title: 'Мероприятия',
      description: 'Посмотреть доступные мероприятия',
      icon: Calendar,
      link: '/events',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Достижения',
      description: 'Мои награды и значки',
      icon: Trophy,
      link: '/achievements',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Рейтинг',
      description: 'Ваша позиция среди учеников',
      icon: BarChart3,
      link: '/rankings',
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'Магазин',
      description: 'Потратить заработанные баллы',
      icon: ShoppingBag,
      link: '/shop',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  Добро пожаловать, {user?.first_name}!
                </h1>
                <p className="text-gray-600 mt-2">
                  {user?.class_grade}{user?.class_letter} класс • 
                  Сегодня отличный день для новых достижений! 🎯
                </p>
              </div>
              <motion.div
                className="text-6xl animate-float"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                🎓
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`${stat.bgColor} rounded-2xl p-6 shadow-lg border border-white/30`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.textColor} mb-2`}>
                {loading && stat.title === 'Покупок' ? (
                  <div className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                ) : (
                  Math.floor(stat.value).toLocaleString()
                )}
              </div>
              <div className={`text-sm ${stat.textColor} opacity-80`}>
                {stat.title}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Рейтинг пользователя */}
        {rankingStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Ваш рейтинг</h2>
                <Link
                  to="/rankings"
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  Посмотреть весь рейтинг
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Позиция в школе</p>
                      <p className="text-2xl font-bold">#{rankingStats.userStats.rank}</p>
                      <p className="text-white/60 text-xs">из {rankingStats.totalStudents} учеников</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Позиция класса</p>
                      <p className="text-2xl font-bold">#{rankingStats.userStats.classRank}</p>
                      <p className="text-white/60 text-xs">из {rankingStats.totalClasses} классов</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Star className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Общие очки</p>
                      <p className="text-2xl font-bold">{rankingStats.userStats.points}</p>
                      <p className="text-white/60 text-xs">{rankingStats.userStats.eventsParticipated} мероприятий</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Топ-3 учеников */}
        {topStudents && topStudents.topStudents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              🏆 Лидеры школы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topStudents.topStudents.slice(0, 3).map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={`bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 ${
                    student.id === user?.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                      'bg-gradient-to-r from-amber-400 to-amber-600'
                    }`}>
                      <span className="text-2xl">
                        {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {student.first_name} {student.last_name}
                      {student.id === user?.id && <span className="text-blue-600 block text-sm">(Вы)</span>}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {student.class_grade}{student.class_letter} класс
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="font-bold text-lg text-yellow-600">{student.total_points}</p>
                        <p className="text-gray-500 text-xs">очков</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg text-blue-600">{student.events_participated}</p>
                        <p className="text-gray-500 text-xs">мероприятий</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.a
                key={action.title}
                href={action.link}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="block bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${action.color} mb-4`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600">
                  {action.description}
                </p>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Последняя активность
          </h2>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity, index) => (
                  <motion.div
                    key={`${activity.type}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${
                      activity.type === 'achievement' 
                        ? 'from-yellow-400 to-orange-500' 
                        : 'from-blue-400 to-purple-500'
                    } rounded-full flex items-center justify-center mr-4`}>
                      {activity.type === 'achievement' ? (
                        <Trophy className="w-6 h-6 text-white" />
                      ) : (
                        <Calendar className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {activity.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {activity.action_type} • {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                    {activity.points > 0 && (
                      <div className="text-green-600 font-semibold">
                        +{activity.points}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет активности</h3>
                <p className="text-gray-600">
                  Участвуйте в мероприятиях и зарабатывайте достижения, чтобы увидеть свою активность здесь!
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;