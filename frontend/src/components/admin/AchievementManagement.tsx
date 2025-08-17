import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Users,
  Trophy,
  Star,
  X,
  UserPlus,
  UserMinus,
  Image
} from 'lucide-react';
import AchievementIconSelector from '../AchievementIconSelector';
import { getAchievementIconPath } from '../../config/simple-images';
import toast from 'react-hot-toast';

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  type: 'participation' | 'excellence' | 'leadership' | 'community';
  points: number;
  badge_color: string;
  created_at: string;
  awarded_count?: number;
  category?: string; // Вычисляется из type
  iconUrl?: string; // Алиас для icon
  userCount?: number; // Алиас для awarded_count
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  classGrade: number;
  classLetter: string;
}

const AchievementManagement: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [achievementUsers, setAchievementUsers] = useState<User[]>([]);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [iconSelectorMode, setIconSelectorMode] = useState<'create' | 'edit'>('create');

  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    category: '',
    points: 10,
    iconUrl: ''
  });

  const categories = ['Академические', 'Спортивные', 'Творческие', 'Социальные', 'Лидерство'];

  // Преобразование категории в тип для API
  const getTypeFromCategory = (category: string): string => {
    const typeMap: { [key: string]: string } = {
      'Академические': 'excellence',
      'Спортивные': 'participation',
      'Творческие': 'community',
      'Социальные': 'community',
      'Лидерство': 'leadership'
    };
    return typeMap[category] || 'participation';
  };

  // Преобразование типа в категорию для отображения
  const getCategoryFromType = (type: string): string => {
    const categoryMap: { [key: string]: string } = {
      'excellence': 'Академические',
      'participation': 'Спортивные',
      'community': 'Творческие',
      'leadership': 'Лидерство'
    };
    return categoryMap[type] || 'Спортивные';
  };

  useEffect(() => {
    console.log('AchievementManagement: Component mounted, loading achievements...');
    fetchAchievements();
    fetchUsers();
  }, []);

  const fetchAchievements = async () => {
    console.log('AchievementManagement: fetchAchievements called');
    try {
      const token = localStorage.getItem('token');
      console.log('AchievementManagement: token exists:', !!token);
      
      if (!token) {
        console.log('AchievementManagement: No token, stopping fetch');
        toast.error('Необходима авторизация');
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/achievements', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('AchievementManagement: response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка загрузки достижений' }));
        throw new Error(errorData.message || 'Ошибка загрузки достижений');
      }
      
      const data = await response.json();
      console.log('AchievementManagement: received data:', data);
      
      // Преобразуем данные для отображения
      const transformedAchievements = (data.achievements || []).map((a: any) => ({
        ...a,
        category: getCategoryFromType(a.type),
        iconUrl: a.icon,
        userCount: a.awarded_count || 0
      }));
      
      setAchievements(transformedAchievements);
    } catch (error) {
      console.error('AchievementManagement: Error in fetchAchievements:', error);
      toast.error('Ошибка загрузки достижений');
    } finally {
      console.log('AchievementManagement: Setting loading to false');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки пользователей');
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const handleIconSelect = (iconPath: string) => {
    if (iconSelectorMode === 'create') {
      setNewAchievement(prev => ({ ...prev, iconUrl: iconPath }));
    } else if (iconSelectorMode === 'edit' && selectedAchievement) {
      // Обновляем поле icon вместо iconUrl для редактирования
      setSelectedAchievement(prev => prev ? { ...prev, icon: iconPath } : null);
    }
    setShowIconSelector(false);
  };

  const createAchievement = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/achievements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newAchievement.title,
          description: newAchievement.description,
          icon: newAchievement.iconUrl || '🏆',
          type: getTypeFromCategory(newAchievement.category),
          points: newAchievement.points,
          badge_color: '#FFD700'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка создания достижения');
      }

      await fetchAchievements();
      setShowCreateModal(false);
      setNewAchievement({
        title: '',
        description: '',
        category: '',
        points: 10,
        iconUrl: ''
      });
      toast.success('Достижение создано успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateAchievement = async () => {
    if (!selectedAchievement) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/achievements/${selectedAchievement.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: selectedAchievement.title,
          description: selectedAchievement.description,
          icon: selectedAchievement.icon || '🏆',
          type: getTypeFromCategory(selectedAchievement.category || 'Спортивные'),
          points: selectedAchievement.points,
          badge_color: selectedAchievement.badge_color || '#FFD700'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка обновления достижения');
      }

      await fetchAchievements();
      setShowEditModal(false);
      setSelectedAchievement(null);
      toast.success('Достижение обновлено успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteAchievement = async (achievementId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это достижение?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/achievements/${achievementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка удаления достижения');
      }

      await fetchAchievements();
      toast.success('Достижение удалено успешно');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchAchievementUsers = async (achievementId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/achievements/${achievementId}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки пользователей достижения');
      
      const data = await response.json();
      setAchievementUsers(data.users || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const assignAchievement = async (userId: number) => {
    if (!selectedAchievement) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/achievements/${selectedAchievement.id}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка назначения достижения');
      }

      await fetchAchievementUsers(selectedAchievement.id);
      toast.success('Достижение назначено пользователю');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const revokeAchievement = async (userId: number) => {
    if (!selectedAchievement) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/achievements/${selectedAchievement.id}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка отзыва достижения');
      }

      await fetchAchievementUsers(selectedAchievement.id);
      toast.success('Достижение отозвано у пользователя');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openAssignModal = async (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    await fetchAchievementUsers(achievement.id);
    setShowAssignModal(true);
  };

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || achievement.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const availableUsers = users.filter(user => 
    !achievementUsers.some(au => au.id === user.id)
  );

  if (loading) {
    console.log('AchievementManagement: Showing loading spinner');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Загружаю достижения...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div style={{ padding: '20px', background: 'white', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h1 style={{ color: 'red', fontSize: '24px', marginBottom: '10px' }}>
          ТЕСТ: AchievementManagement компонент загружается!
        </h1>
        <p>Loading: {loading ? 'ДА' : 'НЕТ'}</p>
        <p>Количество достижений: {achievements.length}</p>
        {achievements.length > 0 && (
          <div>
            <h3>Первое достижение:</h3>
            <p>{JSON.stringify(achievements[0], null, 2)}</p>
          </div>
        )}
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Award className="w-8 h-8 text-yellow-600" />
          <h2 className="text-2xl font-bold text-gray-800">Управление достижениями</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать достижение
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск достижений..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">Все категории</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <div key={achievement.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
                    {achievement.icon && achievement.icon.startsWith('/images') ? (
                      <img
                        src={achievement.icon}
                        alt={achievement.title}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          console.error('Failed to load achievement icon:', achievement.icon);
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '🏆';
                        }}
                      />
                    ) : achievement.icon ? (
                      <span>{achievement.icon}</span>
                    ) : (
                      <Trophy className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{achievement.title}</h3>
                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">{achievement.category}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{achievement.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>{achievement.points} баллов</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{achievement.userCount || 0} получили</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openAssignModal(achievement)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Назначить
                </button>
                <button
                  onClick={() => {
                    setSelectedAchievement(achievement);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteAchievement(achievement.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAchievements.length === 0 && !loading && (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет достижений</h3>
          <p className="text-gray-500">Создайте первое достижение для начала работы</p>
        </div>
      )}

      {/* Create Achievement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Создать достижение</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название достижения"
                value={newAchievement.title}
                onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
              <textarea
                placeholder="Описание достижения"
                value={newAchievement.description}
                onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
              <select
                value={newAchievement.category}
                onChange={(e) => setNewAchievement({ ...newAchievement, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Выберите категорию</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Баллы за достижение"
                value={newAchievement.points}
                onChange={(e) => setNewAchievement({ ...newAchievement, points: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
              
              {/* Icon Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Иконка достижения
                </label>
                <div className="flex items-center space-x-4">
                  {newAchievement.iconUrl && (
                    <img 
                      src={newAchievement.iconUrl} 
                      alt="Выбранная иконка" 
                      className="w-12 h-12 object-contain rounded-lg border"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIconSelectorMode('create');
                      setShowIconSelector(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Image className="w-4 h-4" />
                    <span>Выбрать иконку</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={createAchievement}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Achievement Modal */}
      {showEditModal && selectedAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Редактировать достижение</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название достижения"
                value={selectedAchievement.title}
                onChange={(e) => setSelectedAchievement({ ...selectedAchievement, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
              <textarea
                placeholder="Описание достижения"
                value={selectedAchievement.description}
                onChange={(e) => setSelectedAchievement({ ...selectedAchievement, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
              <select
                value={selectedAchievement.category}
                onChange={(e) => setSelectedAchievement({ ...selectedAchievement, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Выберите категорию</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Баллы за достижение"
                value={selectedAchievement.points}
                onChange={(e) => setSelectedAchievement({ ...selectedAchievement, points: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
              
              {/* Icon Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Иконка достижения
                </label>
                <div className="flex items-center space-x-4">
                  {selectedAchievement.icon && (
                    <img 
                      src={selectedAchievement.icon} 
                      alt="Текущая иконка" 
                      className="w-12 h-12 object-contain rounded-lg border"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIconSelectorMode('edit');
                      setShowIconSelector(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Image className="w-4 h-4" />
                    <span>Изменить иконку</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={updateAchievement}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Achievement Modal */}
      {showAssignModal && selectedAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Управление достижением: {selectedAchievement.title}</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Users with Achievement */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                  Имеют достижение ({achievementUsers.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {achievementUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm">
                        {user.firstName} {user.lastName} ({user.classGrade}{user.classLetter})
                      </span>
                      <button
                        onClick={() => revokeAchievement(user.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Отозвать достижение"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {achievementUsers.length === 0 && (
                    <p className="text-gray-500 text-center py-8">Пока никто не получил это достижение</p>
                  )}
                </div>
              </div>

              {/* Available Users */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-gray-600" />
                  Доступные пользователи ({availableUsers.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">
                        {user.firstName} {user.lastName} ({user.classGrade}{user.classLetter})
                      </span>
                      <button
                        onClick={() => assignAchievement(user.id)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Назначить достижение"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {availableUsers.length === 0 && (
                    <p className="text-gray-500 text-center py-8">Все пользователи уже имеют это достижение</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Icon Selector Modal */}
      {showIconSelector && (
        <AchievementIconSelector
          isOpen={showIconSelector}
          onClose={() => setShowIconSelector(false)}
          onSelect={handleIconSelect}
        />
      )}
    </div>
  );
};

export default AchievementManagement;