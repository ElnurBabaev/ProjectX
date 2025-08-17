import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Trophy, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { productsApi } from '../utils/api';
import { Order } from '../utils/types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const ordersResponse = await productsApi.getMyOrders();
      setOrders(ordersResponse.data || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      setOrders([]);
    } finally {
      setLoading(false);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="space-y-4">
              {[1, 2, 3].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-4">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      Участие в олимпиаде по математике
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Заработано +50 баллов • 2 часа назад
                    </p>
                  </div>
                  <div className="text-green-600 font-semibold">
                    +50
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;