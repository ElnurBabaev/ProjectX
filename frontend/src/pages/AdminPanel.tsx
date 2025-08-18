import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Users, Calendar, ShoppingBag, Award, BarChart3, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import UserManagement from '../components/admin/UserManagement';
import EventManagement from '../components/admin/EventManagement';
import ProductManagement from '../components/admin/ProductManagement';
import AchievementManagement from '../components/admin/AchievementManagement';

interface Stats {
  users: number;
  events: number;
  products: number;
  achievements: number;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ users: 0, events: 0, products: 0, achievements: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: BarChart3 },
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'events', label: 'События', icon: Calendar },
    { id: 'products', label: 'Товары', icon: ShoppingBag },
    { id: 'achievements', label: 'Достижения', icon: Award }
  ];

  useEffect(() => {
    if (!user?.isAdmin) {
      return;
    }
    
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
  const { data } = await api.get('/admin/statistics');
        console.log('AdminPanel: Received stats data:', data);
        // Преобразуем данные из формата API в нужный формат
        setStats({
          users: data.users?.total || 0,
          events: data.events?.total || 0,
          products: data.products?.total || 0,
          achievements: data.achievements?.total_achievements || 0
        });
      
    } catch (error) {
      console.error('AdminPanel: Error fetching stats:', error);
      toast.error('Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/export/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`Экспорт ${type} завершен`);
      }
    } catch (error) {
      toast.error('Ошибка экспорта данных');
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h2>
          <p className="text-gray-600">У вас нет прав для доступа к админ-панели.</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    console.log('AdminPanel: Rendering tab content for:', activeTab);
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'events':
        console.log('AdminPanel: Rendering EventManagement component');
        return <EventManagement />;
      case 'products':
        return <ProductManagement />;
      case 'achievements':
        console.log('AdminPanel: Rendering AchievementManagement component');
        return <AchievementManagement />;
      default:
        return (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Пользователей
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {loading ? '-' : stats.users}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Событий
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {loading ? '-' : stats.events}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShoppingBag className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Товаров
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {loading ? '-' : stats.products}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Достижений
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {loading ? '-' : stats.achievements}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileDown className="w-6 h-6 mr-2" />
                Экспорт данных
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => exportData('users')}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Экспорт пользователей
                </button>
                <button
                  onClick={() => exportData('events')}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Экспорт событий
                </button>
                <button
                  onClick={() => exportData('products')}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Экспорт товаров
                </button>
                <button
                  onClick={() => exportData('achievements')}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Экспорт достижений
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Быстрые действия</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center justify-center px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-blue-800 font-medium">Управление пользователями</span>
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className="flex items-center justify-center px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <Calendar className="w-5 h-5 mr-2 text-green-600" />
                  <span className="text-green-800 font-medium">Создать событие</span>
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className="flex items-center justify-center px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <ShoppingBag className="w-5 h-5 mr-2 text-purple-600" />
                  <span className="text-purple-800 font-medium">Добавить товар</span>
                </button>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className="flex items-center justify-center px-4 py-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                >
                  <Award className="w-5 h-5 mr-2 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">Создать достижение</span>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Админ-панель</h1>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;